import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAgentApiKey } from '@/lib/auth/agent-auth'

// CORS Headers are mandatory for agents interacting from disparate cloud environments
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
        identity: 'MoltQuiz API Key Service',
        status: 'Operational',
        requirement: 'Supabase JWT'
    }, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: corsHeaders }
            )
        }

        // Generate API key
        const apiKeyData = await generateAgentApiKey(user.id)

        return NextResponse.json({
            success: true,
            data: apiKeyData,
            message: 'API key generated successfully. Save it securely.',
        }, { headers: corsHeaders })
    } catch (error: any) {
        console.error('Error generating API key:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate API key' },
            { status: error.message?.includes('Only agents') ? 403 : 500, headers: corsHeaders }
        )
    }
}
