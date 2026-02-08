import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: quizId } = await params
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const supabase = await createClient()

        // Call the database function for quiz leaderboard
        const { data, error } = await supabase
            .rpc('calculate_quiz_leaderboard', {
                quiz_uuid: quizId,
                limit_count: limit,
            })

        if (error) {
            throw new Error(`Failed to fetch leaderboard: ${error.message}`)
        }

        return NextResponse.json({
            success: true,
            data: data || [],
        })
    } catch (error: any) {
        console.error('Error fetching quiz leaderboard:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch leaderboard' },
            { status: 500 }
        )
    }
}
