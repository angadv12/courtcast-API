import { Player, CourtPosition } from '../types';

// Basketball court dimensions (scaled for display)
export const COURT_DIMENSIONS = {
  width: 940, // Assuming 94 feet * 10 pixels/foot
  height: 500, // Assuming 50 feet * 10 pixels/foot
  centerX: 940 / 2,
  centerY: 500 / 2,
};

// Generate mock player data for demonstration
export const generateMockPlayers = (): Player[] => [
  { id: 1, name: 'James Wilson', team: 'home', position: { x: COURT_DIMENSIONS.width * 0.25, y: COURT_DIMENSIONS.height * 0.3 }, number: 23 },
  { id: 2, name: 'Marcus Johnson', team: 'home', position: { x: COURT_DIMENSIONS.width * 0.35, y: COURT_DIMENSIONS.height * 0.45 }, number: 15 },
  { id: 3, name: 'David Chen', team: 'home', position: { x: COURT_DIMENSIONS.width * 0.2, y: COURT_DIMENSIONS.height * 0.5 }, number: 7 },
  { id: 4, name: 'Alex Rodriguez', team: 'home', position: { x: COURT_DIMENSIONS.width * 0.3, y: COURT_DIMENSIONS.height * 0.6 }, number: 32 },
  { id: 5, name: 'Tyler Brown', team: 'home', position: { x: COURT_DIMENSIONS.width * 0.22, y: COURT_DIMENSIONS.height * 0.4 }, number: 11 },
  { id: 6, name: 'Kevin Smith', team: 'away', position: { x: COURT_DIMENSIONS.width * 0.75, y: COURT_DIMENSIONS.height * 0.35 }, number: 8 },
  { id: 7, name: 'Ryan Davis', team: 'away', position: { x: COURT_DIMENSIONS.width * 0.65, y: COURT_DIMENSIONS.height * 0.5 }, number: 21 },
  { id: 8, name: 'Michael Lee', team: 'away', position: { x: COURT_DIMENSIONS.width * 0.8, y: COURT_DIMENSIONS.height * 0.45 }, number: 14 },
  { id: 9, name: 'Chris Garcia', team: 'away', position: { x: COURT_DIMENSIONS.width * 0.7, y: COURT_DIMENSIONS.height * 0.65 }, number: 9 },
  { id: 10, name: 'Jordan Taylor', team: 'away', position: { x: COURT_DIMENSIONS.width * 0.78, y: COURT_DIMENSIONS.height * 0.55 }, number: 3 },
];

// Simulate player movement over time
export const generateCourtPositions = (duration: number): CourtPosition[] => {
  const positions: CourtPosition[] = [];
  const players = generateMockPlayers();
  
  for (let t = 0; t <= duration; t += 0.5) {
    const timestamp = t;
    const movingPlayers = players.map(player => ({
      ...player,
      position: {
        x: player.position.x + Math.sin(t * 0.02 + player.id) * 30,
        y: player.position.y + Math.cos(t * 0.015 + player.id) * 20,
      },
    }));
    
    positions.push({ timestamp, players: movingPlayers });
  }
  
  return positions;
};

export const VIEW_MODES = [
  { id: 'live', name: 'Live View', description: 'Real-time player positions' },
  { id: 'heatmap', name: 'Heat Map', description: 'Player movement density' },
  { id: 'trails', name: 'Movement Trails', description: 'Player path visualization' },
];