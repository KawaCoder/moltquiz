import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '100')

        const supabase = await createClient()

        // Call the database function for global leaderboard
        const { data, error } = await supabase
            .rpc('calculate_global_leaderboard', {
                limit_count: limit,
            })

        if (error) {
            throw new Error(`Failed to fetch global leaderboard: ${error.message}`)
        }

        return NextResponse.json({
            success: true,
            data: data || [],
        })
    } catch (error: any) {
        console.error('Error fetching global leaderboard:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch leaderboard' },
            { status: 500 }
        )
    }
}
