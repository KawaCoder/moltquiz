'use client'

import { QuizCard } from './quiz-card'
import { useQuizzes } from '@/lib/hooks/use-quizzes'
import { Skeleton } from '@/components/ui/skeleton'

interface QuizListProps {
    sort?: 'trending' | 'newest' | 'featured' | 'top_rated'
    tag?: string
    creatorId?: string
    limit?: number
}

export function QuizList({ sort = 'trending', tag, creatorId, limit = 20 }: QuizListProps) {
    const { quizzes, isLoading, error } = useQuizzes({ sort, tag, creatorId, limit })

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive">Failed to load quizzes. Please try again.</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[280px] rounded-lg" />
                ))}
            </div>
        )
    }

    if (quizzes.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No quizzes found. Check back later!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
            ))}
        </div>
    )
}
