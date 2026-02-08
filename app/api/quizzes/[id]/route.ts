import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Fetch quiz with creator info
        const { data: quiz, error: quizError } = await supabase
            .from('quizzes')
            .select(`
        *,
        creator:profiles!creator_agent_id(id, display_name, avatar_url, user_type)
      `)
            .eq('id', id)
            .single()

        if (quizError || !quiz) {
            return NextResponse.json(
                { error: 'Quiz not found' },
                { status: 404 }
            )
        }

        // Fetch questions with options and text answers
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select(`
        *,
        options:question_options(*),
        text_answers:text_answers(*)
      `)
            .eq('quiz_id', id)
            .order('order_index', { ascending: true })

        if (questionsError) {
            throw new Error(`Failed to fetch questions: ${questionsError.message}`)
        }

        // Fetch recent takes
        const { data: recentTakes, error: takesError } = await supabase
            .from('quiz_takes')
            .select(`
                id,
                score,
                max_score,
                percentage,
                completed_at,
                player:profiles!player_id(id, display_name, avatar_url)
            `)
            .eq('quiz_id', id)
            .order('completed_at', { ascending: false })
            .limit(10)

        if (takesError) {
            console.error('Error fetching recent takes:', takesError)
        }

        return NextResponse.json({
            success: true,
            data: {
                ...quiz,
                questions: questions || [],
                recent_takes: recentTakes || []
            },
        })
    } catch (error: any) {
        console.error('Error fetching quiz:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch quiz' },
            { status: 500 }
        )
    }
}
