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
import { Trash2, Plus, ChevronDown, ChevronUp, LayoutList } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { compressImage, ImageCompressionOptions } from '@/lib/image-utils';
import { CompetitorCard } from '@/components/battle/CompetitorCard';
import { Competitor } from '@/types/battle';

type ImageQuality = 'standard' | 'low' | 'lowest';

interface CompetitorItem {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    imageFile: File | null;
    imageUrl?: string;
    imageQuality: ImageQuality;
    useUrl: boolean;
    isCollapsed?: boolean;
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
        { id: uuidv4(), title: '', description: '', videoUrl: '', imageFile: null, imageQuality: 'standard', useUrl: false, isCollapsed: false }
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
                            imageFile: null,
                            imageQuality: 'standard',
                            useUrl: !!(!item.imageFile && item.imageUrl && item.imageUrl.startsWith('http')), // Simple heuristic
                            isCollapsed: true
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
        setItems([...items, { id: uuidv4(), title: '', description: '', videoUrl: '', imageFile: null, imageQuality: 'standard', useUrl: false, isCollapsed: false }]);
    };

    const toggleCollapse = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setItems(items.map(item => item.id === id ? { ...item, isCollapsed: !item.isCollapsed } : item));
    };

    const scrollToItem = (id: string) => {
        const element = document.getElementById(`competitor-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setItems(prev => prev.map(item => item.id === id ? { ...item, isCollapsed: false } : item));
        }
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof CompetitorItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleImageChange = async (id: string, file: File | null, quality: ImageQuality = 'standard') => {
        if (file) {
            try {
                let options: ImageCompressionOptions = { maxDimension: 800, quality: 0.7 };

                if (quality === 'low') {
                    options = { maxDimension: 600, quality: 0.6 };
                } else if (quality === 'lowest') {
                    options = { maxDimension: 400, quality: 0.5 };
                }

                const base64 = await compressImage(file, options);
                setItems(items.map(item => item.id === id ? { ...item, imageFile: file, imageUrl: base64, imageQuality: quality } : item));
            } catch (error) {
                console.error("Error compressing image", error);
                toast.error("Failed to process image");
            }
        } else {
            // If clearing the file
            setItems(items.map(item => item.id === id ? { ...item, imageFile: null, imageUrl: undefined } : item));
        }
    };

    const handleQualityChange = (id: string, quality: ImageQuality) => {
        const item = items.find(i => i.id === id);
        if (item && item.imageFile) {
            handleImageChange(id, item.imageFile, quality);
        } else {
            // Just update state if no file yet
            setItems(items.map(i => i.id === id ? { ...i, imageQuality: quality } : i));
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
            navigate(`/manage`);
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.message || '';
            if (errorMsg.includes('exceeds the maximum allowed size')) {
                toast.error("Arena size too large! Try using 'Lowest' image quality or fewer items.", {
                    duration: 6000,
                    description: "The total size of the arena data exceeds the database limit."
                });
            } else {
                toast.error("Failed to save arena. Please try again.");
            }
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

            <div className="container mx-auto p-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">

                    <aside className="hidden lg:block sticky top-24 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">Quick Navigation</h3>
                            <nav className="space-y-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-left font-normal"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                >
                                    <LayoutList className="mr-2 h-4 w-4" />
                                    Arena Details
                                </Button>
                                <div className="pt-2 pb-1 px-2 text-xs font-medium text-muted-foreground">Competitors</div>
                                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-1 scrollbar-thin">
                                    {items.map((item, index) => (
                                        <Button
                                            key={item.id}
                                            variant="ghost"
                                            className={`w-full justify-start text-left text-sm h-auto py-2 ${!item.isCollapsed ? 'bg-accent/50 text-accent-foreground' : 'text-muted-foreground'}`}
                                            onClick={() => scrollToItem(item.id)}
                                        >
                                            <span className="mr-2 opacity-50 font-mono text-xs">#{index + 1}</span>
                                            <span className="truncate">{item.title || '(Untitled)'}</span>
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left mt-4 border-dashed"
                                    onClick={addItem}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New
                                </Button>
                            </nav>
                        </div>
                    </aside>

                    <div className="space-y-8 min-w-0">
                        <Card className="border-2 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl">Arena Details</CardTitle>
                                {isEditMode && id && (
                                    <div className="mt-2 p-3 bg-muted rounded-md flex items-center justify-between border">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-muted-foreground uppercase">Arena ID</span>
                                            <span className="font-mono font-bold text-lg select-all">{id}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground text-right bg-background px-2 py-1 rounded border">
                                            Editing Mode
                                        </div>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid w-full gap-2">
                                    <Label htmlFor="title" className="text-base font-semibold">Arena Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g., Best UI Framework 2026"
                                        className="text-lg h-12"
                                    />
                                </div>
                                <div className="grid w-full gap-2">
                                    <Label htmlFor="description" className="font-semibold">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="What is this battle about?"
                                        rows={9}
                                        className="resize-y min-h-[400px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b pb-2">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        Competitors
                                        <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}</span>
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Add at least 2 competitors for the arena.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.id} id={`competitor-${item.id}`} className="scroll-mt-28">
                                        <Card className={`overflow-hidden transition-all duration-300 border-l-4 ${!item.isCollapsed ? 'border-l-primary shadow-lg ring-1 ring-primary/5' : 'border-l-muted-foreground/30 shadow-sm opacity-90 hover:opacity-100'}`}>
                                            <div
                                                className="bg-card p-4 flex items-center justify-between cursor-pointer hover:bg-muted/5 transition-colors select-none border-b"
                                                onClick={() => toggleCollapse(item.id)}
                                            >
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${!item.isCollapsed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h3 className={`font-semibold text-lg truncate ${!item.title && 'text-muted-foreground italic'}`}>
                                                            {item.title || 'Untitled Competitor'}
                                                        </h3>
                                                        {item.isCollapsed && item.description && (
                                                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">{item.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground"
                                                        onClick={(e) => toggleCollapse(item.id, e)}
                                                    >
                                                        {item.isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeItem(item.id);
                                                        }}
                                                        disabled={items.length <= 2}
                                                        title="Remove competitor"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {!item.isCollapsed && (
                                                <CardContent className="p-0 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-border">
                                                        <div className="flex-1 p-6 space-y-6 bg-card/50">
                                                            <div className="grid gap-2">
                                                                <Label className="text-foreground">Name <span className="text-destructive">*</span></Label>
                                                                <Input
                                                                    value={item.title}
                                                                    onChange={e => updateItem(item.id, 'title', e.target.value)}
                                                                    placeholder="e.g. React.js"
                                                                    className="bg-background"
                                                                />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label>Description</Label>
                                                                <Textarea
                                                                    value={item.description}
                                                                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                                                                    placeholder="Why is it a strong contender?"
                                                                    rows={8}
                                                                    className="bg-background min-h-[160px]"
                                                                />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label>Reference Link / Video</Label>
                                                                <Input
                                                                    value={item.videoUrl}
                                                                    onChange={e => updateItem(item.id, 'videoUrl', e.target.value)}
                                                                    placeholder="https://youtube.com/..."
                                                                    className="bg-background"
                                                                />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label>Image (Auto-compressed)</Label>
                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant={!item.useUrl ? "default" : "outline"}
                                                                            size="sm"
                                                                            onClick={() => updateItem(item.id, 'useUrl', false)}
                                                                            className="text-xs h-7"
                                                                        >
                                                                            Upload
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant={item.useUrl ? "default" : "outline"}
                                                                            size="sm"
                                                                            onClick={() => updateItem(item.id, 'useUrl', true)}
                                                                            className="text-xs h-7"
                                                                        >
                                                                            URL
                                                                        </Button>
                                                                    </div>

                                                                    {!item.useUrl ? (
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-end gap-2">
                                                                                <div className="flex-1">
                                                                                    <Input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        onChange={e => handleImageChange(item.id, e.target.files?.[0] || null, item.imageQuality)}
                                                                                        className="bg-background cursor-pointer"
                                                                                    />
                                                                                </div>
                                                                                <div className="w-[100px]">
                                                                                    <select
                                                                                        className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                                        value={item.imageQuality}
                                                                                        onChange={(e) => handleQualityChange(item.id, e.target.value as ImageQuality)}
                                                                                    >
                                                                                        <option value="standard">Standard</option>
                                                                                        <option value="low">Low</option>
                                                                                        <option value="lowest">Lowest</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground flex items-center justify-between">
                                                                                <span>
                                                                                    {item.imageQuality === 'standard' && 'Max 800px, 0.7 Quality'}
                                                                                    {item.imageQuality === 'low' && 'Max 600px, 0.6 Quality'}
                                                                                    {item.imageQuality === 'lowest' && 'Max 400px, 0.5 Quality'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <Input
                                                                            value={item.imageUrl || ''}
                                                                            onChange={e => {
                                                                                updateItem(item.id, 'imageUrl', e.target.value);
                                                                                updateItem(item.id, 'imageFile', null);
                                                                            }}
                                                                            placeholder="https://images.unsplash.com/..."
                                                                            className="bg-background"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground p-1 bg-muted rounded border flex items-center gap-2">
                                                                    <span className="text-primary font-bold">INFO:</span>
                                                                    Images are automatically resized and compressed.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 bg-muted/20 p-6 flex flex-col items-center justify-start gap-4">
                                                            <div className="w-full flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider px-1">
                                                                <span>Live Preview</span>
                                                            </div>
                                                            <div className="w-full max-w-[340px] shadow-2xl rounded-xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-300">
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
                                                </CardContent>
                                            )}
                                        </Card>
                                    </div>
                                ))}

                                <Button
                                    onClick={addItem}
                                    variant="outline"
                                    className="w-full py-8 border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group text-lg font-medium"
                                >
                                    <Plus className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                                    Add Another Competitor
                                </Button>
                            </div>

                            <div className="flex justify-end pt-8 pb-12 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 z-10 border-t mt-8">
                                <div className="flex gap-4">
                                    <Button variant="outline" size="lg" onClick={() => navigate('/manage')}>
                                        Cancel
                                    </Button>
                                    <Button size="lg" className="px-8 shadow-lg min-w-[200px]" onClick={handleSubmit} disabled={isLoading}>
                                        {isLoading ? (
                                            <>Saving...</>
                                        ) : (
                                            isEditMode ? 'Update Arena' : 'Create Arena'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
