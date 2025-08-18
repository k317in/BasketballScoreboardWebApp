import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, set, get, push, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../config/firebase';
import { GameMetadata, GameListItem, CreateGameRequest, JoinGameRequest } from '../types/game';

interface GameState {
  currentGameId: string | null;
  availableGames: GameListItem[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentGameId: (gameId: string | null) => void;
  createGame: (gameData: CreateGameRequest, creatorUid: string, creatorName: string) => Promise<string>;
  joinGame: (joinData: JoinGameRequest) => Promise<boolean>;
  leaveGame: () => void;
  fetchAvailableGames: () => Promise<void>;
  updateGameStatus: (gameId: string, status: GameMetadata['status']) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  clearError: () => void;
}

// Simple hash function for passwords (client-side only - not cryptographically secure)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentGameId: null,
      availableGames: [],
      loading: false,
      error: null,

      setCurrentGameId: (gameId: string | null) => {
        set({ currentGameId: gameId });
      },

      createGame: async (gameData: CreateGameRequest, creatorUid: string, creatorName: string): Promise<string> => {
        set({ loading: true, error: null });
        
        try {
          // Generate unique game ID
          const gameRef = push(ref(database, 'gameMetadata'));
          const gameId = gameRef.key!;
          
          const gameMetadata: GameMetadata = {
            gameId,
            gameName: gameData.gameName,
            isPrivate: gameData.isPrivate,
            password: gameData.password ? simpleHash(gameData.password) : undefined,
            creatorUid,
            creatorName,
            status: 'ongoing',
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            playerCount: 1
          };
          
          // Save game metadata
          await set(gameRef, gameMetadata);
          
          // Set as current game
          set({ currentGameId: gameId, loading: false });
          
          return gameId;
        } catch (error: any) {
          set({ loading: false, error: error.message || 'Failed to create game' });
          throw error;
        }
      },

      joinGame: async (joinData: JoinGameRequest): Promise<boolean> => {
        set({ loading: true, error: null });
        
        try {
          // Get game metadata
          const gameRef = ref(database, `gameMetadata/${joinData.gameId}`);
          const snapshot = await get(gameRef);
          
          if (!snapshot.exists()) {
            throw new Error('Game not found');
          }
          
          const gameData: GameMetadata = snapshot.val();
          
          // Check if game is private and password is required
          if (gameData.isPrivate && gameData.password) {
            if (!joinData.password) {
              throw new Error('Password required for private game');
            }
            
            const hashedPassword = simpleHash(joinData.password);
            if (hashedPassword !== gameData.password) {
              throw new Error('Incorrect password');
            }
          }
          
          // Update player count
          await set(ref(database, `gameMetadata/${joinData.gameId}/playerCount`), 
            (gameData.playerCount || 0) + 1);
          
          // Set as current game
          set({ currentGameId: joinData.gameId, loading: false });
          
          return true;
        } catch (error: any) {
          set({ loading: false, error: error.message || 'Failed to join game' });
          return false;
        }
      },

      leaveGame: () => {
        const { currentGameId } = get();
        if (currentGameId) {
          // Decrease player count
          const playerCountRef = ref(database, `gameMetadata/${currentGameId}/playerCount`);
          get(playerCountRef).then((snapshot) => {
            const currentCount = snapshot.val() || 1;
            set(playerCountRef, Math.max(0, currentCount - 1));
          });
        }
        
        set({ currentGameId: null });
      },

      fetchAvailableGames: async () => {
        set({ loading: true, error: null });
        
        try {
          const gamesRef = ref(database, 'gameMetadata');
          const snapshot = await get(gamesRef);
          
          if (snapshot.exists()) {
            const gamesData = snapshot.val();
            const gamesList: GameListItem[] = Object.values(gamesData)
              .filter((game: any) => game.status === 'ongoing')
              .sort((a: any, b: any) => b.lastUpdated - a.lastUpdated);
            
            set({ availableGames: gamesList, loading: false });
          } else {
            set({ availableGames: [], loading: false });
          }
        } catch (error: any) {
          set({ loading: false, error: error.message || 'Failed to fetch games' });
        }
      },

      updateGameStatus: async (gameId: string, status: GameMetadata['status']) => {
        try {
          await set(ref(database, `gameMetadata/${gameId}/status`), status);
          await set(ref(database, `gameMetadata/${gameId}/lastUpdated`), Date.now());
        } catch (error: any) {
          set({ error: error.message || 'Failed to update game status' });
        }
      },

      deleteGame: async (gameId: string) => {
        try {
          await set(ref(database, `gameMetadata/${gameId}`), null);
          
          // If this was the current game, clear it
          const { currentGameId } = get();
          if (currentGameId === gameId) {
            set({ currentGameId: null });
          }
          
          // Refresh available games
          await get().fetchAvailableGames();
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete game' });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'basketball-game',
      partialize: (state) => ({
        currentGameId: state.currentGameId
      })
    }
  )
);