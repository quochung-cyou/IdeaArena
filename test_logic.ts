
import { generateAllMatches, getTotalMatches } from './src/lib/tournament';

const competitors = [
    { id: '1', title: 'C1', description: 'd', imageUrl: '' },
    { id: '2', title: 'C2', description: 'd', imageUrl: '' },
    { id: '3', title: 'C3', description: 'd', imageUrl: '' },
    { id: '4', title: 'C4', description: 'd', imageUrl: '' },
    { id: '5', title: 'C5', description: 'd', imageUrl: '' },
    { id: '6', title: 'C6', description: 'd', imageUrl: '' },
    { id: '7', title: 'C7', description: 'd', imageUrl: '' },
    { id: '8', title: 'C8', description: 'd', imageUrl: '' },
];

const matches = generateAllMatches(competitors as any);
console.log(`Generated ${matches.length} matches for 8 competitors.`);

// Check distribution
const counts = {};
matches.forEach(m => {
    counts[m.competitorA.id] = (counts[m.competitorA.id] || 0) + 1;
    counts[m.competitorB.id] = (counts[m.competitorB.id] || 0) + 1;
});

console.log('Matches per competitor:', counts);
