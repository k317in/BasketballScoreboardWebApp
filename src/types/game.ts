export interface GameMetadata {
  gameId: string;
  gameName: string;
  isPrivate: boolean;
  password?: string; // hashed password for private games
  creatorUid: string;
  creatorName: string;
  status: 'ongoing' | 'finished' | 'paused';
  createdAt: number;
  lastUpdated: number;
  playerCount: number; // number of connected players/viewers
}

export interface GameListItem extends GameMetadata {
  isJoined?: boolean; // whether current user has joined this game
}

export interface CreateGameRequest {
  gameName: string;
  isPrivate: boolean;
  password?: string;
}

export interface JoinGameRequest {
  gameId: string;
  password?: string;
}