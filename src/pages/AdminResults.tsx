import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArenaResults } from '@/hooks/useArenaResults';
import { aggregateResults } from '@/lib/results-aggregation';
import { AreaTopBar } from '@/components/navigation/AreaTopBar';
import { Leaderboard } from '@/components/admin/Leaderboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Share2, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';

export default function AdminResults() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Use custom hook for data fetching and logic
    const {
        arena,
        results,
        loading,
        accessDenied,
        togglePublicResults,
        deleteUserResults
    } = useArenaResults(id, user);

    if (loading) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (accessDenied) {
        return (
            <div className="h-screen flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p>You do not have permission to view these results.</p>
                <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
        );
    }

    if (!arena) return null;

    const isOwner = user?.uid === arena.createdBy;
    const leaderboardItems = aggregateResults(results, arena.items || []);

    const copyShareLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
    };

    const copyId = () => {
        if (arena?.id) {
            navigator.clipboard.writeText(arena.id);
            toast.success("ID copied to clipboard");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AreaTopBar title="Arena Results" hideBackButton={false} onBack={() => navigate('/manage')} />
            <div className="container mx-auto p-4 max-w-6xl space-y-6">

                {/* Header Card */}
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div className="space-y-2">
                            <div>
                                <CardTitle className="text-3xl font-bold">{arena.title}</CardTitle>
                                <CardDescription className="text-base mt-2">{arena.description}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-medium">ID: {arena.id}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyId}>
                                    <Share2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {isOwner && (
                                <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
                                    <Switch
                                        id="public-mode"
                                        checked={arena.publicResults || false}
                                        onCheckedChange={togglePublicResults}
                                    />
                                    <Label htmlFor="public-mode">Public Results</Label>
                                </div>
                            )}

                            {(isOwner || arena.publicResults) && (
                                <Button variant="outline" size="icon" onClick={copyShareLink}>
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leaderboard Section - Takes up 2 columns on large screens */}
                    <Leaderboard items={leaderboardItems} />

                    {/* Stats & Actions Column */}
                    <div className="space-y-6">
                        {/* Summary Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground">Total Responses</span>
                                    <span className="text-2xl font-bold">{results.length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground">Last Response</span>
                                    <span className="text-sm font-medium">
                                        {results[0] ? formatDistanceToNow(results[0].completedAt?.toDate(), { addSuffix: true }) : 'N/A'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Table - Simplified for side column */}
                        <Card className="flex-1">
                            <CardHeader>
                                <CardTitle>Participant Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[500px] overflow-auto">
                                <Table>
                                    <TableHead className="px-4">Player</TableHead>
                                    <TableHead className="px-4 text-right">Actions</TableHead>
                                    <TableBody>
                                        {results.map((result) => (
                                            <TableRow key={result.id}>
                                                <TableCell className="px-4 py-2 font-medium text-sm">
                                                    <div>{result.playerName}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {result.completedAt?.seconds
                                                            ? new Date(result.completedAt.seconds * 1000).toLocaleString(undefined, {
                                                                weekday: 'short',
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-2 text-right">
                                                    {isOwner && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => deleteUserResults(result.playerName)}
                                                            title="Delete all from user"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {results.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                    No activity yet
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
