import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameRoomState {
  currentGameId: string | null;
  setGameId: (gameId: string | null) => void;
  clearGameId: () => void;
}

export const useRoomStore = create<GameRoomState>()(
  persist(
    (set) => ({
      currentGameId: null,
      setGameId: (gameId: string | null) => {
        console.log('Setting game ID to:', gameId);
        set({ currentGameId: gameId });
      },
      clearGameId: () => set({ currentGameId: null })
    }),
    {
      name: 'basketball-game-room'
    }
  )
);