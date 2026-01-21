import { Competitor } from '@/types/battle';

export interface Result {
    id: string;
    playerName: string;
    completedAt: any;
    finalScores: Record<string, number>;
}

export interface AggregatedScore {
    competitorId: string;
    totalScore: number;
    winCount: number; // Number of times ranked #1
    matchCount: number; // Number of times appeared (if we track full matches, but for now just total score from finalScores)
    rank: number;
}

export interface LeaderboardItem extends Competitor {
    stats: AggregatedScore;
}

export function aggregateResults(results: Result[], competitors: Competitor[]): LeaderboardItem[] {
    const scoresMap = new Map<string, AggregatedScore>();

    // Initialize map with all competitors
    competitors.forEach(c => {
        scoresMap.set(c.id, {
            competitorId: c.id,
            totalScore: 0,
            winCount: 0,
            matchCount: 0,
            rank: 0
        });
    });

    results.forEach(result => {
        if (!result.finalScores) return;

        // Find the max score in this result to determine the "winner" (rank 1) for this session
        let maxScoreInSession = -1;
        let winnerIdInSession = '';

        Object.entries(result.finalScores).forEach(([id, score]) => {
            const currentStats = scoresMap.get(id);
            if (currentStats) {
                currentStats.totalScore += score;

                if (score > maxScoreInSession) {
                    maxScoreInSession = score;
                    winnerIdInSession = id;
                }
            }
        });

        // Credit the win
        if (winnerIdInSession && scoresMap.has(winnerIdInSession)) {
            scoresMap.get(winnerIdInSession)!.winCount += 1;
        }
    });

    // Convert to array and sort
    const aggregated = Array.from(scoresMap.values())
        .sort((a, b) => b.totalScore - a.totalScore); // Sort by total score descending

    // Assign rank
    aggregated.forEach((item, index) => {
        item.rank = index + 1;
    });

    // Merge with competitor details
    return aggregated.map(stats => {
        const competitor = competitors.find(c => c.id === stats.competitorId);
        if (!competitor) {
            // Fallback for missing competitor data (shouldn't happen with integrity)
            return {
                id: stats.competitorId,
                title: 'Unknown Item',
                description: '',
                imageUrl: '',
                stats
            } as LeaderboardItem;
        }
        return {
            ...competitor,
            stats
        };
    });
}
