import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'sonner';
import { Competitor } from '@/types/battle';
import { Result } from '@/lib/results-aggregation';

export interface ArenaData {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    publicResults?: boolean;
    items: Competitor[];
}

export function useArenaResults(arenaId: string | undefined, user: any) {
    const [arena, setArena] = useState<ArenaData | null>(null);
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!arenaId) return;
            setLoading(true);
            try {
                // Fetch Arena Details
                const arenaRef = doc(db, 'arenas', arenaId);
                const arenaSnap = await getDoc(arenaRef);

                if (!arenaSnap.exists()) {
                    toast.error("Arena not found");
                    setLoading(false);
                    return;
                }

                const arenaData = { id: arenaSnap.id, ...arenaSnap.data() } as ArenaData;
                setArena(arenaData);

                // Access Control Check
                const isOwner = user?.uid === arenaData.createdBy;
                const isPublic = arenaData.publicResults;

                if (!isOwner && !isPublic) {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                // Fetch Results
                const q = query(
                    collection(db, 'arena_results'),
                    where('arenaId', '==', arenaId)
                );

                const querySnapshot = await getDocs(q);
                const loadedResults: Result[] = [];
                querySnapshot.forEach((doc) => {
                    loadedResults.push({ id: doc.id, ...doc.data() } as Result);
                });

                // Sort by date desc
                loadedResults.sort((a, b) =>
                    (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0)
                );

                setResults(loadedResults);

            } catch (error: any) {
                console.error("Error fetching data:", error);
                if (error.code === 'permission-denied') {
                    setAccessDenied(true);
                } else {
                    toast.error("Failed to load results");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [arenaId, user]);

    const togglePublicResults = async (checked: boolean) => {
        if (!arena) return;
        try {
            await updateDoc(doc(db, 'arenas', arena.id), {
                publicResults: checked
            });
            setArena({ ...arena, publicResults: checked });
            toast.success(checked ? "Results are now public" : "Results are now private");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const deleteUserResults = async (playerName: string) => {
        if (!confirm(`Are you sure you want to delete all results for "${playerName}"?`)) return;

        try {
            const userResults = results.filter(r => r.playerName === playerName);
            const batch = writeBatch(db);

            userResults.forEach(r => {
                batch.delete(doc(db, 'arena_results', r.id));
            });

            await batch.commit();

            setResults(prev => prev.filter(r => r.playerName !== playerName));
            toast.success(`Deleted ${userResults.length} records for ${playerName}`);
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete records");
        }
    };

    return {
        arena,
        results,
        loading,
        accessDenied,
        togglePublicResults,
        deleteUserResults
    };
}
