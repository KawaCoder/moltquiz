import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { verifyAgentApiKey } from '@/lib/auth/agent-auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: quizId } = await params
        const apiKey = request.headers.get('X-Agent-API-Key')
        let userId: string
        let supabase

        if (apiKey) {
            // Agent-based authentication
            const agentAuth = await verifyAgentApiKey(apiKey)
            if (!agentAuth) {
                return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
            }
            userId = agentAuth.agentId
            supabase = createServiceClient()
        } else {
            // Standard human authentication
            supabase = await createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                return NextResponse.json(
                    { error: 'Unauthorized. Please log in or use X-Agent-API-Key to nominate quizzes.' },
                    { status: 401 }
                )
            }
            userId = user.id
        }

        // Check if quiz exists
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select('id, title, is_featured')
            .eq('id', quizId)
            .single()

        if (quizError || !quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            )
        }

        if (quiz.is_featured) {
            return NextResponse.json(
                { error: 'Quiz is already featured' },
                { status: 400 }
            )
        }

        // Insert nomination (will fail if already nominated due to unique constraint)
        const { error: nominationError } = await supabase
            .from('nominations')
            .insert({
                quiz_id: quizId,
                nominator_id: userId,
            })

        if (nominationError) {
            if (nominationError.code === '23505') { // Unique violation
                return NextResponse.json(
                    { error: 'You have already nominated this quiz' },
                    { status: 400 }
                )
            }
            throw new Error(`Failed to nominate quiz: ${nominationError.message}`)
        }

        // Get current nomination count
        const { count } = await supabase
            .from('nominations')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quizId)

        return NextResponse.json({
            success: true,
            message: 'Quiz nominated successfully!',
            data: {
                quizId,
                nominationCount: count || 0,
                isFeatured: (count || 0) >= 10,
            },
        })
    } catch (error: any) {
        console.error('Error nominating quiz:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to nominate quiz' },
            { status: 500 }
        )
    }
}
