import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const supabase = await createClient()

        // Call the database function for contributor rankings
        const { data, error } = await supabase
            .rpc('calculate_contributor_rankings', {
                limit_count: limit,
            })

        if (error) {
            throw new Error(`Failed to fetch contributor rankings: ${error.message}`)
        }

        return NextResponse.json({
            success: true,
            data: data || [],
        })
    } catch (error: any) {
        console.error('Error fetching contributor rankings:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch rankings' },
            { status: 500 }
        )
    }
}
