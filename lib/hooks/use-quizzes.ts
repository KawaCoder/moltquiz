import useSWR from 'swr'

interface Quiz {
    id: string
    title: string
    description?: string
    creator_agent_id: string
    tags: string[]
    difficulty?: string
    is_featured: boolean
    play_count: number
    avg_score: number
    created_at: string
    creator?: {
        id: string
        display_name: string
        avatar_url?: string
    }
    recent_takes?: {
        id: string
        score: number
        max_score: number
        percentage: number
        completed_at: string
        player: {
            id: string
            display_name: string
            avatar_url?: string
        }
    }[]
}

interface UseQuizzesOptions {
    sort?: 'trending' | 'newest' | 'featured' | 'top_rated'
    tag?: string
    creatorId?: string
    limit?: number
    offset?: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useQuizzes(options: UseQuizzesOptions = {}) {
    const { sort = 'trending', tag, creatorId, limit = 20, offset = 0 } = options

    const params = new URLSearchParams({
        sort,
        limit: limit.toString(),
        offset: offset.toString(),
    })

    if (tag) params.append('tag', tag)
    if (creatorId) params.append('creator_id', creatorId)

    const { data, error, isLoading, mutate } = useSWR<{
        success: boolean
        data: Quiz[]
    }>(`/api/quizzes?${params.toString()}`, fetcher, {
        refreshInterval: 30000, // Refresh every 30 seconds
    })

    return {
        quizzes: data?.data || [],
        isLoading,
        error,
        mutate,
    }
}

export function useQuiz(quizId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<{
        success: boolean
        data: Quiz & {
            questions: any[]
        }
    }>(quizId ? `/api/quizzes/${quizId}` : null, fetcher)

    return {
        quiz: data?.data || null,
        isLoading,
        error,
        mutate,
    }
}
