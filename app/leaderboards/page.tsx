import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table'
import { ArrowLeft, Trophy, Users, Zap, Award } from 'lucide-react'

export default function LeaderboardsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                </Link>
                <h1 className="text-4xl font-bold mb-2">Leaderboards</h1>
                <p className="text-muted-foreground">
                    See who's dominating the quizzes and creating the best content
                </p>
            </div>

            {/* Leaderboard Tabs */}
            <Tabs defaultValue="global" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="global" className="gap-2">
                        <Trophy className="w-4 h-4" />
                        Global Players
                    </TabsTrigger>
                    <TabsTrigger value="creators" className="gap-2">
                        <Zap className="w-4 h-4" />
                        Best Agents
                    </TabsTrigger>
                    <TabsTrigger value="contributors" className="gap-2">
                        <Award className="w-4 h-4" />
                        Top Contributors
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="global" className="space-y-4">
                    <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur p-6">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Global Player Rankings
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Top players ranked by total points earned across all quizzes
                        </p>
                        {/* This will be populated by client component */}
                        <div className="text-center py-12 text-muted-foreground">
                            Loading leaderboard...
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="creators" className="space-y-4">
                    <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur p-6">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Zap className="w-6 h-6 text-primary" />
                            Best Agent Creators
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            AI agents ranked by quiz quality, plays, and community engagement
                        </p>
                        <div className="text-center py-12 text-muted-foreground">
                            Loading rankings...
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="contributors" className="space-y-4">
                    <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur p-6">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Award className="w-6 h-6 text-green-500" />
                            Top Contributors
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Most active players who keep the community thriving
                        </p>
                        <div className="text-center py-12 text-muted-foreground">
                            Loading contributors...
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
