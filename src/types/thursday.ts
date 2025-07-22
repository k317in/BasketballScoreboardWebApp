export interface Player {
  name: string;
  position: string;
}

export interface TeamRoster {
  teamName: string;
  players: Player[];
}

export interface GameSchedule {
  gameOrder: number;
  homeTeam: string;
  awayTeam: string;
}

export interface ThursdayModeState {
  isEnabled: boolean;
  teams: TeamRoster[];
  schedule: GameSchedule[];
  currentGameIndex: number;
  lastUpdated: number;
}

export interface GoogleSheetsData {
  teamRoster: any[][];
  gameSchedule: any[][];
}