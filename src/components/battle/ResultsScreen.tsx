import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Competitor, MatchResult } from '@/types/battle';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface ResultsScreenProps {
  arenaId: string;
  playerName: string;
  competitors: Competitor[];
  finalScores: Map<string, number>;
  allResults: MatchResult[];
  onRestart: () => void;
}

interface RankedCompetitor extends Competitor {
  score: number;
  rank: number;
}

export function ResultsScreen({
  arenaId,
  playerName,
  competitors,
  finalScores,
  allResults,
  onRestart,
}: ResultsScreenProps) {
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saving');
  const hasSaved = useRef(false);

  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;

    const saveResults = async () => {
      try {
        setSaveStatus('saving');
        // Convert Map to Object for Firestore
        const scoresObject = Object.fromEntries(finalScores);

        // Sanitize results to remove imageUrl
        const sanitizedResults = allResults.map(result => ({
          ...result,
          competitorA: (({ imageUrl, ...rest }) => rest)(result.competitorA),
          competitorB: (({ imageUrl, ...rest }) => rest)(result.competitorB),
          winner: (({ imageUrl, ...rest }) => rest)(result.winner),
          loser: (({ imageUrl, ...rest }) => rest)(result.loser),
        }));

        await addDoc(collection(db, 'arena_results'), {
          arenaId,
          playerName,
          results: sanitizedResults,
          finalScores: scoresObject,
          completedAt: serverTimestamp()
        });
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save results:', error);
        setSaveStatus('error');
      }
    };

    saveResults();
  }, [arenaId, playerName, allResults, finalScores]);

  const rankedCompetitors: RankedCompetitor[] = competitors
    .map(c => ({
      ...c,
      score: finalScores.get(c.id) || 0,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const getBarWidth = (score: number) => {
    const maxScore = rankedCompetitors[0]?.score || 1;
    return `${(score / maxScore) * 100}%`;
  };

  return (
    <div className="arena-container min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-6 py-12"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="arena-badge inline-block mb-4"
        >
          Tournament Complete
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="arena-title text-4xl md:text-5xl font-bold mb-2"
        >
          Final Rankings
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground"
        >
          Judged by {playerName}
        </motion.p>
      </motion.header>

      {/* Rankings */}
      <div className="flex-1 px-6 pb-12 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          {rankedCompetitors.map((competitor, index) => (
            <motion.div
              key={competitor.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="arena-card p-4 md:p-6"
            >
              <div className="flex items-center gap-4 md:gap-6">
                {/* Rank */}
                <div className={`
                  w-12 h-12 flex items-center justify-center rounded-lg font-display font-bold text-xl
                  ${competitor.rank === 1 ? 'bg-primary text-primary-foreground' : ''}
                  ${competitor.rank === 2 ? 'bg-secondary text-secondary-foreground' : ''}
                  ${competitor.rank === 3 ? 'bg-muted text-muted-foreground' : ''}
                  ${competitor.rank > 3 ? 'bg-muted/50 text-muted-foreground' : ''}
                `}>
                  {competitor.rank}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-display font-semibold text-lg truncate">
                      {competitor.title}
                    </h3>
                    <span className="text-muted-foreground text-sm flex-shrink-0">
                      {competitor.score} pts
                    </span>
                  </div>

                  {/* Score Bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: competitor.rank === 1
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted-foreground) / 0.5)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: getBarWidth(competitor.score) }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-8 min-h-[24px]"
        >
          {saveStatus === 'saving' && (
            <p className="text-muted-foreground animate-pulse">Saving results...</p>
          )}
          {saveStatus === 'saved' && (
            <p className="text-green-500 font-medium">Results saved successfully</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-red-500">Failed to save results</p>
          )}
        </motion.div>

        {/* Restart Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="text-center mt-4"
        >
          <button
            onClick={onRestart}
            className="arena-button-ghost"
          >
            Start New Tournament
          </button>
        </motion.div>
      </div>
    </div>
  );
}
