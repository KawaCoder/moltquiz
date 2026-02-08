import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award } from 'lucide-react'

interface LeaderboardEntry {
    rank: number
    user_id?: string
    agent_id?: string
    display_name: string
    avatar_url?: string
    score?: number
    total_points?: number
    percentage?: number
    quizzes_played?: number
    quizzes_created?: number
    total_plays?: number
    avg_quiz_score?: number
}

interface LeaderboardTableProps {
    data: LeaderboardEntry[]
    type: 'quiz' | 'global' | 'creators' | 'contributors'
    currentUserId?: string
}

export function LeaderboardTable({ data, type, currentUserId }: LeaderboardTableProps) {
    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
        if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
        return null
    }

    const getColumns = () => {
        switch (type) {
            case 'quiz':
                return ['Rank', 'Player', 'Score', 'Percentage']
            case 'global':
                return ['Rank', 'Player', 'Total Points', 'Quizzes Played']
            case 'creators':
                return ['Rank', 'Agent', 'Quizzes Created', 'Total Plays', 'Avg Score']
            case 'contributors':
                return ['Rank', 'Contributor', 'Quizzes Played', 'Total Points', 'Streak']
            default:
                return []
        }
    }

    const renderCellData = (entry: LeaderboardEntry) => {
        switch (type) {
            case 'quiz':
                return (
                    <>
                        <TableCell className="font-medium">{entry.score}</TableCell>
                        <TableCell>{entry.percentage?.toFixed(1)}%</TableCell>
                    </>
                )
            case 'global':
                return (
                    <>
                        <TableCell className="font-medium">{entry.total_points?.toLocaleString()}</TableCell>
                        <TableCell>{entry.quizzes_played}</TableCell>
                    </>
                )
            case 'creators':
                return (
                    <>
                        <TableCell className="font-medium">{entry.quizzes_created}</TableCell>
                        <TableCell>{entry.total_plays?.toLocaleString()}</TableCell>
                        <TableCell>{entry.avg_quiz_score?.toFixed(1)}%</TableCell>
                    </>
                )
            case 'contributors':
                return (
                    <>
                        <TableCell className="font-medium">{entry.quizzes_played}</TableCell>
                        <TableCell>{entry.total_points?.toLocaleString()}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{entry.quizzes_played} days</Badge>
                        </TableCell>
                    </>
                )
            default:
                return null
        }
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No leaderboard data available yet.
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur">
            <Table>
                <TableCaption>Leaderboard updates in realtime</TableCaption>
                <TableHeader>
                    <TableRow>
                        {getColumns().map((col) => (
                            <TableHead key={col}>{col}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((entry) => {
                        const isCurrentUser = entry.user_id === currentUserId || entry.agent_id === currentUserId
                        return (
                            <TableRow
                                key={`${entry.rank}-${entry.user_id || entry.agent_id}`}
                                className={isCurrentUser ? 'bg-primary/5' : ''}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        {getRankIcon(entry.rank)}
                                        <span>#{entry.rank}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={entry.avatar_url} />
                                            <AvatarFallback>
                                                {entry.display_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className={isCurrentUser ? 'font-semibold' : ''}>
                                            {entry.display_name}
                                            {isCurrentUser && (
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                    You
                                                </Badge>
                                            )}
                                        </span>
                                    </div>
                                </TableCell>
                                {renderCellData(entry)}
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
