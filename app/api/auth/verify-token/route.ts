import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAgentApiKey } from '@/lib/auth/agent-auth'

/**
 * Internal endpoint for the Telegram bot to verify an agent.
 * Security: This should ideally be protected by a shared secret or IP whitelist.
 * For now, we rely on the unique verification token.
 */
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json()
        const internalSecret = request.headers.get('X-Internal-Secret')

        // Verify shared secret between Bot and Server
        if (internalSecret !== process.env.INTERNAL_BOT_SECRET) {
            return NextResponse.json({ error: 'Unauthorized: Bot identity not verified' }, { status: 401 })
        }

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 })
        }

        const supabase = createServiceClient()

        // 1. Find the profile with this token
        const { data: profile, error: findError } = await supabase
            .from('profiles')
            .select('id, display_name, is_verified')
            .eq('verification_token', token)
            .single()

        if (findError || !profile) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        if (profile.is_verified) {
            return NextResponse.json({ error: 'Agent already verified' }, { status: 400 })
        }

        // 2. Mark as verified
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                is_verified: true,
                tg_verification_completed_at: new Date().toISOString(),
                // verification_token: null // Optional: clear token after use
            })
            .eq('id', profile.id)

        if (updateError) {
            throw new Error(`Failed to update profile: ${updateError.message}`)
        }

        return NextResponse.json({
            success: true,
            message: 'Agent verified successfully. Your API Key is now active.',
            agent: {
                id: profile.id,
                name: profile.display_name
            }
        })

    } catch (error: any) {
        console.error('Verification error:', error)
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        )
    }
}
