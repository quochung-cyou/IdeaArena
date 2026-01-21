import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2 } from 'lucide-react';
import { Match, MatchResult } from '@/types/battle';
import { CompetitorCard } from './CompetitorCard';
import { BattleSlider } from './BattleSlider';
import { getRoundLabel, getProgress } from '@/lib/tournament';

interface BattleScreenProps {
  playerName: string;
  currentMatch: Match;
  matchNumber: number;
  totalMatches: number;
  completedCount: number;
  onMatchComplete: (result: MatchResult) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function BattleScreen({
  playerName,
  currentMatch,
  matchNumber,
  totalMatches,
  completedCount,
  onMatchComplete,
  onUndo,
  canUndo,
}: BattleScreenProps) {
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<MatchResult | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset state when match changes
  useEffect(() => {
    setShowResult(false);
    setLastResult(null);
    setIsTransitioning(false);
  }, [currentMatch.id]);

  const handleSliderComplete = (scoreA: number, scoreB: number) => {
    const winner = scoreA >= scoreB ? currentMatch.competitorA : currentMatch.competitorB;
    const loser = scoreA >= scoreB ? currentMatch.competitorB : currentMatch.competitorA;

    const result: MatchResult = {
      competitorA: currentMatch.competitorA,
      competitorB: currentMatch.competitorB,
      scoreA,
      scoreB,
      winner,
      loser,
    };

    setLastResult(result);
    setShowResult(true);
    setIsTransitioning(true);

    // Delay before moving to next match for visual feedback
    setTimeout(() => {
      onMatchComplete(result);
    }, 1200);
  };

  const roundLabel = getRoundLabel(matchNumber, totalMatches);
  const progress = getProgress(completedCount, totalMatches);

  return (
    <div className="arena-container min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-b border-border gap-3"
      >
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          {canUndo && (
            <button
              onClick={onUndo}
              disabled={isTransitioning}
              className="p-2 -ml-2 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Undo last vote"
            >
              <Undo2 className="w-5 h-5" />
            </button>
          )}
          <div className="text-left">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Player</span>
            <h2 className="font-display font-semibold truncate max-w-[150px]">{playerName}</h2>
          </div>
        </div>

        <div className="text-center order-first sm:order-none">
          <span className="arena-badge">{roundLabel}</span>
          <p className="text-muted-foreground text-sm mt-1">
            Match {matchNumber} of {totalMatches}
          </p>
        </div>

        <div className="text-center sm:text-right">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Progress</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </div>
      </motion.header>

      {/* Battle Area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMatch.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch max-w-6xl mx-auto w-full"
          >
            {/* Left Competitor */}
            <CompetitorCard
              competitor={currentMatch.competitorA}
              side="left"
              isActive={!showResult}
              showResult={showResult}
              isWinner={lastResult?.winner.id === currentMatch.competitorA.id}
            />

            {/* VS Divider */}
            <div className="flex lg:flex-col items-center justify-center py-2 lg:py-0 lg:px-4 flex-shrink-0">
              <motion.div
                className="w-12 h-px lg:w-px lg:h-12 bg-border"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <motion.span
                className="arena-versus mx-3 lg:my-3"
                animate={{
                  scale: showResult ? 0.8 : 1,
                  opacity: showResult ? 0.5 : 1,
                }}
              >
                VS
              </motion.span>
              <motion.div
                className="w-12 h-px lg:w-px lg:h-12 bg-border"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
              />
            </div>

            {/* Right Competitor */}
            <CompetitorCard
              competitor={currentMatch.competitorB}
              side="right"
              isActive={!showResult}
              showResult={showResult}
              isWinner={lastResult?.winner.id === currentMatch.competitorB.id}
            />
          </motion.div>
        </AnimatePresence>

        {/* Slider */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <BattleSlider
            onComplete={handleSliderComplete}
            disabled={isTransitioning}
            competitorAName={currentMatch.competitorA.title}
            competitorBName={currentMatch.competitorB.title}
          />
        </motion.div>
      </div>
    </div>
  );
}
