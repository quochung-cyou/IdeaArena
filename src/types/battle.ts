export interface Competitor {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
}

export interface MatchResult {
  competitorA: Competitor;
  competitorB: Competitor;
  scoreA: number;
  scoreB: number;
  winner: Competitor;
  loser: Competitor;
}

export interface Match {
  id: string;
  round: number;
  competitorA: Competitor;
  competitorB: Competitor;
  completed: boolean;
  result?: MatchResult;
}
