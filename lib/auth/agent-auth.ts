import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export interface AgentApiKey {
    id: string
    apiKey: string // Only returned once during generation
    keyPrefix: string
    agentId: string
    createdAt: string
}

/**
 * Generate a new API key for an agent
 * Returns the full API key (only shown once) and metadata
 */
export async function generateAgentApiKey(agentId: string): Promise<AgentApiKey> {
    const supabase = createServiceClient()

    // Verify user is an agent
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', agentId)
        .single()

    if (profileError || !profile) {
        throw new Error('Profile not found')
    }

    if (profile.user_type !== 'agent') {
        throw new Error('Only agents can generate API keys')
    }

    // Generate random API key (32 bytes = 64 hex chars)
    const apiKey = `mq_${randomBytes(32).toString('hex')}`
    const keyPrefix = apiKey.substring(0, 11) // "mq_" + first 8 chars
    const keyHash = await bcrypt.hash(apiKey, 10)

    // Store hashed key in database
    const { data, error } = await supabase
        .from('agent_api_keys')
        .insert({
            agent_id: agentId,
            key_hash: keyHash,
            key_prefix: keyPrefix,
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create API key: ${error.message}`)
    }

    return {
        id: data.id,
        apiKey, // Full key - only returned once!
        keyPrefix,
        agentId,
        createdAt: data.created_at,
    }
}

/**
 * Verify an API key and return the agent profile if valid
 */
export async function verifyAgentApiKey(apiKey: string) {
    const supabase = createServiceClient()

    if (!apiKey || !apiKey.startsWith('mq_')) {
        return null
    }

    // Get all API keys (we need to check hashes)
    const { data: keys, error } = await supabase
        .from('agent_api_keys')
        .select('*, profiles(*)')

    if (error || !keys) {
        return null
    }

    // Check each key hash
    for (const key of keys) {
        const isValid = await bcrypt.compare(apiKey, key.key_hash)
        if (isValid) {
            // Check if profile is verified
            const profile = key.profiles as any
            if (!profile || !profile.is_verified) {
                return null
            }

            // Update last_used_at
            await supabase
                .from('agent_api_keys')
                .update({ last_used_at: new Date().toISOString() })
                .eq('id', key.id)

            return {
                keyId: key.id,
                agentId: key.agent_id,
                profile: profile,
            }
        }
    }

    return null
}

/**
 * Check if a user is an agent
 */
export async function isAgent(userId: string): Promise<boolean> {
    const supabase = createServiceClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single()

    if (error || !data) {
        return false
    }

    return data.user_type === 'agent'
}

/**
 * List all API keys for an agent (without revealing full keys)
 */
export async function listAgentApiKeys(agentId: string) {
    const supabase = createServiceClient()

    const { data, error } = await supabase
        .from('agent_api_keys')
        .select('id, key_prefix, created_at, last_used_at')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to list API keys: ${error.message}`)
    }

    return data
}

/**
 * Revoke (delete) an API key
 */
export async function revokeAgentApiKey(keyId: string, agentId: string) {
    const supabase = createServiceClient()

    const { error } = await supabase
        .from('agent_api_keys')
        .delete()
        .eq('id', keyId)
        .eq('agent_id', agentId)

    if (error) {
        throw new Error(`Failed to revoke API key: ${error.message}`)
    }

    return true
}
