import { LeaderboardItem } from '@/lib/results-aggregation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Star } from 'lucide-react';

interface LeaderboardProps {
    items: LeaderboardItem[];
}

export function Leaderboard({ items }: LeaderboardProps) {
    if (items.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-8">
                    No results to display yet.
                </CardContent>
            </Card>
        );
    }

    const maxScore = items[0]?.stats.totalScore || 1;

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Live Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {items.map((item, index) => (
                    <div key={item.id} className="relative">
                        <div className="flex items-center gap-4 mb-2">
                            {/* Rank Badge */}
                            <div className={`
                                w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                                ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : ''}
                                ${index === 1 ? 'bg-gray-100 text-gray-700 border border-gray-200' : ''}
                                ${index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' : ''}
                                ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                            `}>
                                {index === 0 && <Trophy className="h-4 w-4" />}
                                {index === 1 && <Medal className="h-4 w-4" />}
                                {index === 2 && <Medal className="h-4 w-4" />}
                                {index > 2 && index + 1}
                            </div>

                            {/* Contestant Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-base truncate">{item.title}</h3>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="font-medium">{item.stats.totalScore} pts</span>
                                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                                            <Star className="h-3 w-3" />
                                            {item.stats.winCount} Wins
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative h-2 w-full bg-secondary overflow-hidden rounded-full">
                                    <div
                                        className={`h-full transition-all duration-500 ease-out ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-orange-400' :
                                                        'bg-primary/50'
                                            }`}
                                        style={{ width: `${(item.stats.totalScore / maxScore) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Optional: Small Image Thumbnail if available */}
                            {item.imageUrl && (
                                <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted hidden sm:block">
                                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
