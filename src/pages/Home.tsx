import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { QrCode, X } from 'lucide-react';

import { AreaTopBar } from '@/components/navigation/AreaTopBar';

export default function Home() {
    const { user, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [arenaId, setArenaId] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        if (isScanning) {
            const startScanner = async () => {
                try {
                    // Slight delay to ensure DOM element exists
                    await new Promise(resolve => setTimeout(resolve, 100));

                    if (!document.getElementById('reader')) {
                        console.log("Reader element missing, aborting start");
                        return;
                    }

                    if (!scannerRef.current) {
                        scannerRef.current = new Html5Qrcode("reader");
                    }

                    const config = {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    };

                    await scannerRef.current.start(
                        { facingMode: "environment" }, // Prefer back camera
                        config,
                        (decodedText) => {
                            handleScanSuccess(decodedText);
                        },
                        (errorMessage) => {
                            // ignore errors for each frame
                        }
                    );
                } catch (err) {
                    // Check if error is due to element being removed (user closed modal)
                    if (!document.getElementById('reader')) {
                        return;
                    }
                    console.error("Error starting scanner", err);
                    toast.error("Could not start camera", {
                        description: "Please ensure you have granted camera permissions."
                    });
                    setIsScanning(false);
                }
            };

            startScanner();
        } else {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(err => console.error("Failed to stop scanner", err));
            }
        }

        return () => {
            // Cleanup on unmount or when scanning stops
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on cleanup", err));
            }
        };
    }, [isScanning]);

    const handleScanSuccess = async (decodedText: string) => {
        if (isValidating) return;

        console.log("Scanned:", decodedText);

        // Stop scanning immediately on success
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
        }

        // Parse URL to get ID
        // Expected format: http://localhost:8080/arena/ID
        // or just ID if they encoded just the ID (less likely but possible)
        let extractedId = decodedText;

        try {
            if (decodedText.includes('/arena/')) {
                const parts = decodedText.split('/arena/');
                if (parts.length > 1) {
                    extractedId = parts[1].split('/')[0]; // Handle potential trailing slashes or query params
                    extractedId = extractedId.split('?')[0];
                }
            }
        } catch (e) {
            console.warn("Error parsing URL, using raw text", e);
        }

        if (extractedId) {
            setArenaId(extractedId);
            validateAndJoin(extractedId);
        }
    };

    const validateAndJoin = async (id: string) => {
        if (!id.trim()) return;

        setIsValidating(true);
        try {
            const docRef = doc(db, 'arenas', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                navigate(`/arena/${id}`);
            } else {
                toast.error("Arena not found", {
                    description: `ID: ${id} does not exist.`
                });
            }
        } catch (error) {
            console.error("Error checking arena:", error);
            toast.error("Something went wrong", {
                description: "Please try again later."
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleJoin = () => {
        validateAndJoin(arenaId);
    };

    const handleCreate = async () => {
        if (!user) {
            try {
                await signInWithGoogle();
            } catch (error) {
                console.error(error);
            }
        } else {
            navigate('/create');
        }
    };

    const handleManage = () => {
        navigate('/manage');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col relative">
            {isScanning && (
                <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md bg-background rounded-lg overflow-hidden relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full"
                            onClick={() => window.location.reload()}
                        >
                            <X className="h-6 w-6" />
                        </Button>
                        <div className="p-4 text-center">
                            <h3 className="text-lg font-semibold mb-2">Scan Arena QR</h3>
                            <div id="reader" className="w-full h-64 bg-black rounded-lg overflow-hidden"></div>
                            <p className="text-sm text-muted-foreground mt-4">
                                Point your camera at an arena QR code to join.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {user && <AreaTopBar hideBackButton title="Dashboard" />}
            <div className={`flex-1 flex items-center justify-center p-4 ${user ? '-mt-16' : ''}`}>
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold">Idea Arena</CardTitle>
                        <CardDescription>Join a battle of ideas or host your own.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Join Arena</h3>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter Arena ID"
                                    value={arenaId}
                                    onChange={(e) => setArenaId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                />
                                <Button onClick={handleJoin} disabled={isValidating}>
                                    {isValidating ? 'Checking...' : 'Join'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsScanning(true)}
                                    disabled={isValidating}
                                    title="Scan QR Code"
                                >
                                    <QrCode className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Button
                                className="w-full"
                                variant="default"
                                onClick={handleCreate}
                            >
                                {user ? 'Create New Arena' : 'Login to Create Arena'}
                            </Button>

                            {user && (
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={handleManage}
                                >
                                    Manage My Arenas
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
