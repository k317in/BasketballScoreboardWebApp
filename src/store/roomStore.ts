import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RoomState {
  currentRoom: string;
  setRoom: (roomId: string) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      currentRoom: 'court-1', // Default to a specific room
      setRoom: (roomId: string) => {
        console.log('Setting room to:', roomId);
        set({ currentRoom: roomId });
      },
      clearRoom: () => set({ currentRoom: 'court-1' })
    }),
    {
      name: 'basketball-room'
    }
  )
);