import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TrendingUp, Users, Star } from 'lucide-react'

interface QuizCardProps {
    quiz: {
        id: string
        title: string
        description?: string
        tags: string[]
        difficulty?: string
        is_featured: boolean
        play_count: number
        avg_score: number
        creator?: {
            display_name: string
            avatar_url?: string
        }
    }
}

export function QuizCard({ quiz }: QuizCardProps) {
    const difficultyColors = {
        easy: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
        medium: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
        hard: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    }

    return (
        <Link href={`/quizzes/${quiz.id}`}>
            <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 text-xl">{quiz.title}</CardTitle>
                        {quiz.is_featured && (
                            <Badge variant="secondary" className="shrink-0">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured
                            </Badge>
                        )}
                    </div>
                    {quiz.description && (
                        <CardDescription className="line-clamp-2">
                            {quiz.description}
                        </CardDescription>
                    )}
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* Tags */}
                    {quiz.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {quiz.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                            {quiz.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{quiz.tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>{quiz.play_count} plays</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            <span>{Math.round(quiz.avg_score)}% avg</span>
                        </div>
                    </div>

                    {/* Difficulty */}
                    {quiz.difficulty && (
                        <Badge
                            variant="secondary"
                            className={difficultyColors[quiz.difficulty as keyof typeof difficultyColors]}
                        >
                            {quiz.difficulty}
                        </Badge>
                    )}
                </CardContent>

                <CardFooter>
                    {/* Creator */}
                    {quiz.creator && (
                        <div className="flex items-center gap-2 text-sm">
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={quiz.creator.avatar_url} />
                                <AvatarFallback>
                                    {quiz.creator.display_name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">
                                by <span className="text-foreground font-medium">{quiz.creator.display_name}</span>
                            </span>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </Link>
    )
}
