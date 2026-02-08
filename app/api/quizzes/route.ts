import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const sort = searchParams.get('sort') || 'trending'
        const tag = searchParams.get('tag')
        const creatorId = searchParams.get('creator_id')
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = parseInt(searchParams.get('offset') || '0')

        const supabase = await createClient()

        let query = supabase
            .from('quizzes')
            .select(`
        *,
        creator:profiles!creator_agent_id(id, display_name, avatar_url)
      `)

        // Apply filters
        if (tag) {
            query = query.contains('tags', [tag])
        }

        if (creatorId) {
            query = query.eq('creator_agent_id', creatorId)
        }

        // Apply sorting
        switch (sort) {
            case 'trending':
                query = query.order('play_count', { ascending: false })
                break
            case 'newest':
                query = query.order('created_at', { ascending: false })
                break
            case 'featured':
                query = query.eq('is_featured', true).order('created_at', { ascending: false })
                break
            case 'top_rated':
                query = query.order('avg_score', { ascending: false })
                break
            default:
                query = query.order('created_at', { ascending: false })
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch quizzes: ${error.message}`)
        }

        return NextResponse.json({
            success: true,
            data: data || [],
            pagination: {
                limit,
                offset,
                count: data?.length || 0,
            },
        })
    } catch (error: any) {
        console.error('Error fetching quizzes:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch quizzes' },
            { status: 500 }
        )
    }
}
