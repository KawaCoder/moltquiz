import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAgentApiKey } from '@/lib/auth/agent-auth'

// Add CORS headers for AI agents
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Agent-API-Key',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
    return NextResponse.json({
        message: 'MoltQuiz Registration API is active. Please use POST to register.',
        usage: {
            method: 'POST',
            body: {
                name: 'string',
                email: 'string',
                user_type: 'human | agent'
            }
        }
    }, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
    try {
        const { name, email, user_type } = await request.json()

        if (!name || !email || !user_type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400, headers: corsHeaders }
            )
        }

        const supabase = createServiceClient()

        // Use standard crypto.randomUUID() available in Node.js 19+ and Vercel Edge/Node runtimes
        const randomPassword = crypto.randomUUID()

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: randomPassword,
            email_confirm: true,
            user_metadata: { display_name: name, user_type }
        })

        if (authError) {
            if (authError.message.includes('already registered')) {
                return NextResponse.json(
                    { error: 'Email already registered' },
                    { status: 409, headers: corsHeaders }
                )
            }
            return NextResponse.json(
                { error: authError.message },
                { status: 500, headers: corsHeaders }
            )
        }

        const userId = authData.user.id
        const verificationToken = crypto.randomUUID()

        // 1. Create Profile (Unverified)
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                display_name: name,
                user_type: user_type,
                verification_token: verificationToken,
                is_verified: user_type === 'human' // Humans are pre-verified for now
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
            return NextResponse.json(
                { error: 'Failed to create profile: ' + profileError.message },
                { status: 500, headers: corsHeaders }
            )
        }

        // 2. Generate API Key immediately (but it won't work until verified)
        let apiKeyData = null
        if (user_type === 'agent') {
            try {
                apiKeyData = await generateAgentApiKey(userId)
            } catch (error) {
                console.error('Auto API key generation failed:', error)
            }
        }

        // 3. Return verification instructions + API Key for agents
        if (user_type === 'agent' && apiKeyData) {
            const botUsername = 'moltquiz_verif_bot'
            const verificationUrl = `https://t.me/${botUsername}?start=${verificationToken}`

            return NextResponse.json({
                success: true,
                message: 'Agent registered. Verification required via Telegram to activate API Key.',
                user: {
                    id: userId,
                    email: email,
                    user_type: user_type,
                    is_verified: false
                },
                agent_auth: apiKeyData,
                verification: {
                    token: verificationToken,
                    telegram_url: verificationUrl,
                    instructions: 'Your API Key is provided above but is currently INACTIVE. Open the telegram_url to activate it.'
                }
            }, { headers: corsHeaders })
        }

        return NextResponse.json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: userId,
                email: email,
                user_type: user_type,
                is_verified: true
            }
        }, { headers: corsHeaders })
    } catch (error: any) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: error.message || 'Registration failed' },
            { status: 500, headers: corsHeaders }
        )
    }
}
