import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Copy, Share2 } from 'lucide-react';
import { toast } from "sonner";
import QRCode from "react-qr-code";

import { AreaTopBar } from '@/components/navigation/AreaTopBar';

interface Arena {
    id: string;
    title: string;
    description: string;
    isOpen: boolean;
    createdAt: any;
}

export default function ManageGames() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [arenas, setArenas] = useState<Arena[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArena, setSelectedArena] = useState<Arena | null>(null);

    useEffect(() => {
        const fetchArenas = async () => {
            if (!user) return;

            try {
                const q = query(
                    collection(db, "arenas"),
                    where("createdBy", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(q);
                const loadedArenas: Arena[] = [];
                querySnapshot.forEach((doc) => {
                    loadedArenas.push({ id: doc.id, ...doc.data() } as Arena);
                });
                setArenas(loadedArenas);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchArenas();
    }, [user]);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const arenaRef = doc(db, "arenas", id);
            await updateDoc(arenaRef, {
                isOpen: !currentStatus
            });
            setArenas(arenas.map(a => a.id === id ? { ...a, isOpen: !currentStatus } : a));
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success("ID Copied", {
            description: "Arena ID copied to clipboard"
        });
    };

    if (!user) {
        navigate("/");
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <AreaTopBar title="Manage My Arenas" />
            <div className="container mx-auto p-4 max-w-4xl">

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="grid gap-4">
                        {arenas.length === 0 && <p className="text-muted-foreground">No arenas created yet.</p>}
                        {arenas.map((arena) => (
                            <Card key={arena.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex flex-col">
                                        <CardTitle className="text-xl font-bold">{arena.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <span className="font-mono text-xs bg-muted p-1 rounded">ID: {arena.id}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => copyToClipboard(arena.id)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </CardDescription>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Label htmlFor={`switch-${arena.id}`}>Receiving Responses</Label>
                                        <Switch
                                            id={`switch-${arena.id}`}
                                            checked={arena.isOpen}
                                            onCheckedChange={() => toggleStatus(arena.id, arena.isOpen)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500 mb-4">{arena.description}</p>
                                    <div className="flex gap-2">
                                        <Button onClick={() => navigate(`/arena/${arena.id}`)}>Play</Button>
                                        <Button variant="secondary" onClick={() => navigate(`/edit/${arena.id}`)}>Edit</Button>
                                        <Button variant="outline" onClick={() => navigate(`/results/${arena.id}`)}>Results</Button>
                                        <Button variant="outline" size="icon" onClick={() => setSelectedArena(arena)}>
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selectedArena} onOpenChange={(open) => !open && setSelectedArena(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Share Arena</DialogTitle>
                        <DialogDescription>
                            Let others join your arena by sharing this code.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedArena && (
                        <div className="flex flex-col items-center space-y-6 py-4">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold">{selectedArena.title}</h3>
                                <p className="text-muted-foreground">{selectedArena.description}</p>
                            </div>

                            <div className="p-4 bg-white rounded-xl shadow-sm border">
                                <QRCode
                                    value={`${window.location.origin}/arena/${selectedArena.id}`}
                                    size={200}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>

                            <div className="w-full space-y-2">
                                <Label>Arena ID</Label>
                                <div className="flex items-center space-x-2">
                                    <div className="grid flex-1 gap-2">
                                        <div className="flex items-center justify-center p-3 bg-muted rounded-md font-mono text-lg font-bold tracking-wider">
                                            {selectedArena.id}
                                        </div>
                                    </div>
                                    <Button type="submit" size="icon" className="px-3" onClick={() => copyToClipboard(selectedArena.id)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
