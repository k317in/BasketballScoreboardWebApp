export interface Team {
  name: string;
  score: number;
  fouls: number;
  timeouts: number;
  color: string;
  logo?: string;
  wins: number;
  losses: number;
}

export interface GameSettings {
  gameDuration: number; // in minutes
  periodCount: number;
  shotClockDuration: number; // in seconds
  shotClockEnabled: boolean; // whether shot clock is enabled
  foulCountEnabled: boolean; // whether foul count is enabled
  timeoutsPerTeam: number; // number of timeouts per team
}

export interface ScoreboardState {
  team1: Team;
  team2: Team;
  period: number;
  gameTime: number; // in seconds
  shotClockTime: number; // in seconds
  isGameRunning: boolean;
  isShotClockRunning: boolean;
  gameSettings: GameSettings;
  isFullMode: boolean;
  isFullscreen: boolean;
  showProportionalBanners: boolean;
}

export interface SocketEvents {
  'scoreboard-update': ScoreboardState;
  'join-room': string;
  'leave-room': string;
}