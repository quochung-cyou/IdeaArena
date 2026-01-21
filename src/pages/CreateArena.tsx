import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { compressImage } from '@/lib/image-utils';
import { CompetitorCard } from '@/components/battle/CompetitorCard';
import { Competitor } from '@/types/battle';

interface CompetitorItem {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    imageFile: File | null;
    imageUrl?: string;
}

import { AreaTopBar } from '@/components/navigation/AreaTopBar';

export default function CreateArena() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [items, setItems] = useState<CompetitorItem[]>([
        { id: uuidv4(), title: '', description: '', videoUrl: '', imageFile: null }
    ]);

    useEffect(() => {
        if (!user && !isLoading) {
            // Handle redirect if needed, currently empty in original
        }
    }, [user, isLoading]);

    useEffect(() => {
        const fetchArenaData = async () => {
            if (id) {
                setIsEditMode(true);
                try {
                    const docRef = doc(db, 'arenas', id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.createdBy !== user?.uid) {
                            toast.error("You do not have permission to edit this arena.");
                            navigate('/manage');
                            return;
                        }
                        setTitle(data.title);
                        setDescription(data.description);
                        const loadedItems = data.items.map((item: any) => ({
                            id: item.id || uuidv4(),
                            title: item.title,
                            description: item.description,
                            videoUrl: item.videoUrl,
                            imageUrl: item.imageUrl,
                            imageFile: null
                        }));
                        setItems(loadedItems);
                    } else {
                        toast.error("Arena not found");
                        navigate('/manage');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to load arena data");
                }
            }
        };
        if (user && id) {
            fetchArenaData();
        }
    }, [id, user, navigate]);


    const addItem = () => {
        setItems([...items, { id: uuidv4(), title: '', description: '', videoUrl: '', imageFile: null }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof CompetitorItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleImageChange = async (id: string, file: File | null) => {
        if (file) {
            try {
                const base64 = await compressImage(file);
                setItems(items.map(item => item.id === id ? { ...item, imageFile: file, imageUrl: base64 } : item));
            } catch (error) {
                console.error("Error compressing image", error);
                toast.error("Failed to process image");
            }
        } else {
            updateItem(id, 'imageFile', null);
        }
    };

    const handleSubmit = async () => {
        if (!title || items.some(i => !i.title)) {
            toast.error('Please fill in global title and all item titles');
            return;
        }

        setIsLoading(true);

        try {
            // Process items - we already have base64 in imageUrl from handleImageChange
            // Just need to map to the clean object structure
            const processedItems = items.map((item) => {
                return {
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    videoUrl: item.videoUrl,
                    imageUrl: item.imageUrl || ''
                };
            });

            const arenaData = {
                title,
                description,
                items: processedItems,
                ...(isEditMode ? {} : {
                    createdBy: user?.uid,
                    createdAt: serverTimestamp(),
                    isOpen: true
                })
            };

            if (isEditMode && id) {
                await updateDoc(doc(db, 'arenas', id), arenaData);
                toast.success("Arena updated successfully!");
            } else {
                await addDoc(collection(db, 'arenas'), arenaData);
                toast.success("Arena created successfully!");
            }

            navigate(`/manage`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save arena");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <div className="p-8 text-center">Please login to continue</div>;
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <AreaTopBar title={isEditMode ? 'Edit Arena' : 'Create New Arena'} onBack={() => navigate('/manage')} />
            <div className="container mx-auto p-4 max-w-5xl">

                <div className="space-y-8">
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle>Arena Details</CardTitle>
                            {isEditMode && id && (
                                <div className="mt-2 p-3 bg-muted rounded-md flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono text-muted-foreground uppercase">Arena ID</span>
                                        <span className="font-mono font-bold text-lg select-all">{id}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground text-right">
                                        You are editing an existing arena.
                                    </div>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="title" className="text-base">Arena Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g., Best UI Framework 2026"
                                    className="text-lg"
                                />
                            </div>
                            <div className="grid w-full gap-1.5">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What is this battle about?"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                            <div>
                                <h2 className="text-2xl font-bold">Competitors</h2>
                                <p className="text-muted-foreground text-sm">Add at least 2 competitors for the arena.</p>
                            </div>
                            <Button onClick={addItem} size="lg"><Plus className="mr-2 h-5 w-5" /> Add Competitor</Button>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {items.map((item, index) => (
                                <Card key={item.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Input Section */}
                                            <div className="flex-1 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-border bg-card">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-lg text-muted-foreground">Competitor #{index + 1}</h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                                                        onClick={() => removeItem(item.id)}
                                                        disabled={items.length <= 2}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label>Name</Label>
                                                    <Input
                                                        value={item.title}
                                                        onChange={e => updateItem(item.id, 'title', e.target.value)}
                                                        placeholder="e.g. React.js"
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label>Description</Label>
                                                    <Textarea
                                                        value={item.description}
                                                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                                                        placeholder="Why is it a strong contender?"
                                                        rows={3}
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label>Reference Link</Label>
                                                    <Input
                                                        value={item.videoUrl}
                                                        onChange={e => updateItem(item.id, 'videoUrl', e.target.value)}
                                                        placeholder="https://..."
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label>Image (Auto-compressed)</Label>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={e => handleImageChange(item.id, e.target.files?.[0] || null)}
                                                    />
                                                    <p className="text-xs text-muted-foreground">Images are automatically resized and compressed for fast loading.</p>
                                                </div>
                                            </div>

                                            {/* Preview Section */}
                                            <div className="flex-1 bg-muted/10 p-6 flex flex-col justify-center items-center">
                                                <div className="w-full max-w-md">
                                                    <Label className="mb-2 block text-center text-muted-foreground uppercase tracking-widest text-xs">Preview Card</Label>
                                                    <div className="transform scale-90 sm:scale-100 transition-transform origin-top">
                                                        <CompetitorCard
                                                            competitor={{
                                                                id: item.id,
                                                                title: item.title || 'Untitled',
                                                                description: item.description || 'No description provided.',
                                                                imageUrl: item.imageUrl,
                                                                videoUrl: item.videoUrl
                                                            }}
                                                            side="left"
                                                            isActive={true}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="flex justify-end pt-8 pb-12 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent p-4 z-10">
                            <Button size="lg" className="px-8 shadow-lg" onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? 'Saving Arena...' : (isEditMode ? 'Update Arena' : 'Create Arena')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
