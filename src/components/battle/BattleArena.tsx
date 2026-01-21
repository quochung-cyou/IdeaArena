import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Competitor, Match, MatchResult } from '@/types/battle';
import { generateAllMatches, calculateFinalScores } from '@/lib/tournament';
import { EntryScreen } from './EntryScreen';
import { BattleScreen } from './BattleScreen';
import { ResultsScreen } from './ResultsScreen';
import NotFound from '@/pages/NotFound';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Phase = 'entry' | 'battle' | 'results';

export function BattleArena() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('entry');
  const [playerName, setPlayerName] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [allResults, setAllResults] = useState<MatchResult[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [arenaTitle, setArenaTitle] = useState('');
  const [arenaDescription, setArenaDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArena = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'arenas', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!data.isOpen) {
            setError("This arena is closed for new responses.");
            setLoading(false);
            return;
          }
          setCompetitors(data.items);
          setArenaTitle(data.title);
          setArenaDescription(data.description);
        } else {
          setError('Arena not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load arena');
      } finally {
        setLoading(false);
      }
    };

    fetchArena();
  }, [id]);

  const currentMatch = matches[currentMatchIndex];
  const totalMatches = matches.length;
  const completedCount = allResults.length;

  const handleStart = useCallback((name: string) => {
    setPlayerName(name);
    const allMatches = generateAllMatches(competitors);

    if (allMatches.length === 0) {
      return;
    }

    setMatches(allMatches);
    setCurrentMatchIndex(0);
    setAllResults([]);
    setPhase('battle');
  }, [competitors]);

  const handleMatchComplete = useCallback((result: MatchResult) => {
    setAllResults(prev => [...prev, result]);

    const nextIndex = currentMatchIndex + 1;

    if (nextIndex >= totalMatches) {
      setPhase('results');
    } else {
      setCurrentMatchIndex(nextIndex);
    }
  }, [currentMatchIndex, totalMatches]);




  const handleRestart = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleUndo = useCallback(() => {
    if (phase === 'results') {
      setPhase('battle');
      setCurrentMatchIndex(matches.length - 1);
      setAllResults(prev => prev.slice(0, -1));
      return;
    }

    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(prev => prev - 1);
      setAllResults(prev => prev.slice(0, -1));
    }
  }, [phase, matches.length, currentMatchIndex]);

  const finalScores = useMemo(
    () => calculateFinalScores(allResults),
    [allResults]
  );

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Arena...</div>;
  if (error) return <NotFound />;

  return (
    <AnimatePresence mode="wait">
      {phase === 'entry' && (
        <motion.div
          key="entry"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <EntryScreen
            title={arenaTitle}
            description={arenaDescription}
            onStart={handleStart}
          />
        </motion.div>
      )}

      {phase === 'battle' && currentMatch && (
        <motion.div
          key={`battle-${currentMatch.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BattleScreen
            playerName={playerName}
            currentMatch={currentMatch}
            matchNumber={currentMatchIndex + 1}
            totalMatches={totalMatches}
            completedCount={completedCount}
            onMatchComplete={handleMatchComplete}
            onUndo={handleUndo}
            canUndo={currentMatchIndex > 0}
          />
        </motion.div>
      )}

      {phase === 'results' && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ResultsScreen
            arenaId={id!}
            playerName={playerName}
            competitors={competitors}
            finalScores={finalScores}
            allResults={allResults}
            onRestart={handleRestart}
          />
        </motion.div>
      )}

      {phase === 'battle' && !currentMatch && (
        <motion.div
          key="loading"
          className="arena-container min-h-screen flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-muted-foreground">Loading next match...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
