import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'guest' | 'table';

interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isTable: boolean;
  login: (id: string, name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isTable: false,

      login: (id: string, name: string) => {
        const user: User = {
          id,
          name,
          role: 'table'
        };
        set({
          user,
          isAuthenticated: true,
          isTable: true
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isTable: false
        });
      }
    }),
    {
      name: 'basketball-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isTable: state.isTable
      })
    }
  )
);