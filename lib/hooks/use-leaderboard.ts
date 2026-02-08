import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useQuizLeaderboard(quizId: string | null, limit = 50) {
    const { data, error, isLoading, mutate } = useSWR(
        quizId ? `/api/leaderboards/quiz/${quizId}?limit=${limit}` : null,
        fetcher,
        {
            refreshInterval: 10000, // Refresh every 10 seconds for realtime feel
        }
    )

    return {
        leaderboard: data?.data || [],
        isLoading,
        error,
        mutate,
    }
}

export function useGlobalLeaderboard(limit = 100) {
    const { data, error, isLoading, mutate } = useSWR(
        `/api/leaderboards/global?limit=${limit}`,
        fetcher,
        {
            refreshInterval: 15000,
        }
    )

    return {
        leaderboard: data?.data || [],
        isLoading,
        error,
        mutate,
    }
}

export function useCreatorRankings(limit = 50) {
    const { data, error, isLoading, mutate } = useSWR(
        `/api/leaderboards/creators?limit=${limit}`,
        fetcher,
        {
            refreshInterval: 15000,
        }
    )

    return {
        rankings: data?.data || [],
        isLoading,
        error,
        mutate,
    }
}

export function useContributorRankings(limit = 50) {
    const { data, error, isLoading, mutate } = useSWR(
        `/api/leaderboards/contributors?limit=${limit}`,
        fetcher,
        {
            refreshInterval: 15000,
        }
    )

    return {
        rankings: data?.data || [],
        isLoading,
        error,
        mutate,
    }
}
