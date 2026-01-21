import { Competitor, Match, MatchResult } from '@/types/battle';

/**
 * Simple round-robin tournament system
 * Each competitor faces every other competitor exactly once
 * This ensures all matchups happen regardless of competitor count
 */

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate all possible unique pairs from competitors
 * Uses round-robin algorithm for fair matchups
 */
export function generateAllMatches(competitors: Competitor[]): Match[] {
  if (competitors.length < 2) {
    return [];
  }

  const shuffled = shuffleArray([...competitors]);
  const matches: Match[] = [];
  let matchId = 0;

  // Generate all unique pairs
  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      matches.push({
        id: `match-${matchId++}`,
        round: 1, // We'll assign rounds after
        competitorA: shuffled[i],
        competitorB: shuffled[j],
        completed: false,
      });
    }
  }

  // Shuffle all potential matches for variety
  const shuffledMatches = shuffleArray(matches);

  // Filter matches to limit the number of rounds (Balanced Partial Round Robin)
  // We want to ensure each competitor plays a reasonable number of matches (e.g., 5)
  // instead of every single other competitor if the list is long.
  const MAX_MATCHES_PER_COMPETITOR = 5;
  const matchCounts = new Map<string, number>();
  competitors.forEach(c => matchCounts.set(c.id, 0));

  const selectedMatches: Match[] = [];

  for (const match of shuffledMatches) {
    const countA = matchCounts.get(match.competitorA.id) || 0;
    const countB = matchCounts.get(match.competitorB.id) || 0;

    // If we have enough competitors (e.g. 8), we can skip matches if both have played enough.
    // Ideally we'd optimize this to be perfectly even, but a greedy approach on shuffled list works well for "random" tournaments.
    // For small N (<= 6), we just keep all matches (full round robin).
    if (competitors.length <= 6 || (countA < MAX_MATCHES_PER_COMPETITOR && countB < MAX_MATCHES_PER_COMPETITOR)) {
      selectedMatches.push(match);
      matchCounts.set(match.competitorA.id, countA + 1);
      matchCounts.set(match.competitorB.id, countB + 1);
    }
  }

  // Assign round numbers
  const finalMatches = selectedMatches;
  const matchesPerRound = Math.max(1, Math.floor(competitors.length / 2));

  finalMatches.forEach((match, index) => {
    match.round = Math.floor(index / matchesPerRound) + 1;
  });

  return finalMatches;
}

/**
 * Calculate total number of matches for n competitors
 * Formula: n * (n-1) / 2
 */
export function getTotalMatches(competitorCount: number): number {
  return (competitorCount * (competitorCount - 1)) / 2;
}

/**
 * Calculate final scores from all match results
 */
export function calculateFinalScores(
  allResults: MatchResult[]
): Map<string, number> {
  const scores = new Map<string, number>();

  allResults.forEach((result) => {
    const currentA = scores.get(result.competitorA.id) || 0;
    const currentB = scores.get(result.competitorB.id) || 0;

    scores.set(result.competitorA.id, currentA + result.scoreA);
    scores.set(result.competitorB.id, currentB + result.scoreB);
  });

  return scores;
}

/**
 * Get round label for display
 */
export function getRoundLabel(currentMatch: number, totalMatches: number): string {
  const progress = currentMatch / totalMatches;

  if (progress >= 0.9) return 'Final Matches';
  if (progress >= 0.7) return 'Late Stage';
  if (progress >= 0.4) return 'Mid Stage';
  return 'Opening Matches';
}

/**
 * Get progress percentage
 */
export function getProgress(completedMatches: number, totalMatches: number): number {
  if (totalMatches === 0) return 0;
  return Math.round((completedMatches / totalMatches) * 100);
}
