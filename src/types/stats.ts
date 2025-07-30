export interface Player {
  id: string;
  name: string;
  jerseyNumber: string;
  position: string;
  teamId: 1 | 2;
}

export type StatType = 
  | 'points' 
  | 'rebounds' 
  | 'assists' 
  | 'steals' 
  | 'blocks' 
  | 'turnovers' 
  | 'free_throws' 
  | 'three_pointers';

export interface StatEvent {
  id: string;
  playerId: string;
  playerName: string;
  teamId: 1 | 2;
  statType: StatType;
  value: number; // 1, 2, 3 for points; 1 for other stats
  gameTime: number; // seconds remaining
  period: number;
  systemTimestamp: number;
  gameId?: string; // For Tuesday Mode
}

export interface TeamStats {
  teamId: 1 | 2;
  timeoutsUsed: number;
  fouls: number;
  scorePerPeriod: Record<number, number>; // period -> score
}

export interface StatState {
  // Player rosters
  team1Players: Player[];
  team2Players: Player[];
  
  // Stat events history
  statEvents: StatEvent[];
  
  // Team stats
  team1Stats: TeamStats;
  team2Stats: TeamStats;
  
  // Current game context
  currentGameId: string | null;
  isLinkedMode: boolean; // true = syncs with scoreboard, false = standalone
  
  // Last updated timestamp
  lastUpdated: number;
}

export interface PlayerStatSummary {
  playerId: string;
  playerName: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  freeThrows: number;
  threePointers: number;
  totalStats: number;
}

export interface GameExportData {
  gameInfo: {
    gameId: string | null;
    team1Name: string;
    team2Name: string;
    finalScore: string;
    periods: number;
    duration: string;
    exportTimestamp: number;
  };
  players: Player[];
  statEvents: StatEvent[];
  teamStats: TeamStats[];
  playerSummaries: PlayerStatSummary[];
}