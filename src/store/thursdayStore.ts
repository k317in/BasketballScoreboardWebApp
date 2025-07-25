import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThursdayModeState, TeamRoster, GameSchedule } from '../types/thursday';

interface ThursdayStore extends ThursdayModeState {
  // Actions
  enableThursdayMode: () => void;
  disableThursdayMode: () => void;
  setTeams: (teams: TeamRoster[]) => void;
  setSchedule: (schedule: GameSchedule[]) => void;
  setCurrentGameIndex: (index: number) => void;
  nextGame: () => void;
  previousGame: () => void;
  updateLastUpdated: () => void;
  
  // Getters
  getCurrentGame: () => GameSchedule | null;
  getTeamByName: (name: string) => TeamRoster | null;
  getCurrentHomeTeam: () => TeamRoster | null;
  getCurrentAwayTeam: () => TeamRoster | null;
  getTotalGames: () => number;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
}

export const useThursdayStore = create<ThursdayStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isEnabled: false,
      teams: [],
      schedule: [],
      currentGameIndex: 0,
      lastUpdated: 0,

      // Actions
      enableThursdayMode: () => set({ isEnabled: true }),
      
      disableThursdayMode: () => set({ 
        isEnabled: false,
        teams: [],
        schedule: [],
        currentGameIndex: 0
      }),

      setTeams: (teams) => set({ teams, lastUpdated: Date.now() }),
      
      setSchedule: (schedule) => set({ 
        schedule, 
        currentGameIndex: 0, // Reset to first game when schedule changes
        lastUpdated: Date.now() 
      }),

      setCurrentGameIndex: (index) => {
        const { schedule } = get();
        const validIndex = Math.max(0, Math.min(index, schedule.length - 1));
        set({ currentGameIndex: validIndex, lastUpdated: Date.now() });
      },

      nextGame: () => {
        const { currentGameIndex, schedule } = get();
        if (currentGameIndex < schedule.length - 1) {
          set({ 
            currentGameIndex: currentGameIndex + 1,
            lastUpdated: Date.now()
          });
        }
      },

      previousGame: () => {
        const { currentGameIndex } = get();
        if (currentGameIndex > 0) {
          set({ 
            currentGameIndex: currentGameIndex - 1,
            lastUpdated: Date.now()
          });
        }
      },

      updateGameResult: (gameIndex, result) => {
        const { schedule } = get();
        const updatedSchedule = [...schedule];
        if (updatedSchedule[gameIndex]) {
          updatedSchedule[gameIndex] = { ...updatedSchedule[gameIndex], result };
          set({ 
            schedule: updatedSchedule,
            lastUpdated: Date.now()
          });
        }
      },

      updateLastUpdated: () => set({ lastUpdated: Date.now() }),

      updateGameResult: (gameIndex, result) => {
        const { schedule } = get();
        const updatedSchedule = [...schedule];
        if (updatedSchedule[gameIndex]) {
          updatedSchedule[gameIndex] = { ...updatedSchedule[gameIndex], result };
          set({ 
            schedule: updatedSchedule,
            lastUpdated: Date.now()
          });
        }
      },

      // Getters
      getCurrentGame: () => {
        const { schedule, currentGameIndex } = get();
        return schedule[currentGameIndex] || null;
      },

      getTeamByName: (name) => {
        const { teams } = get();
        return teams.find(team => team.teamName === name) || null;
      },

      getCurrentHomeTeam: () => {
        const { getCurrentGame, getTeamByName } = get();
        const currentGame = getCurrentGame();
        return currentGame ? getTeamByName(currentGame.homeTeam) : null;
      },

      getCurrentAwayTeam: () => {
        const { getCurrentGame, getTeamByName } = get();
        const currentGame = getCurrentGame();
        return currentGame ? getTeamByName(currentGame.awayTeam) : null;
      },

      getTotalGames: () => {
        const { schedule } = get();
        return schedule.length;
      },

      canGoNext: () => {
        const { currentGameIndex, schedule } = get();
        return currentGameIndex < schedule.length - 1;
      },

      canGoPrevious: () => {
        const { currentGameIndex } = get();
        return currentGameIndex > 0;
      }
    }),
    {
      name: 'thursday-mode',
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        teams: state.teams,
        schedule: state.schedule,
        currentGameIndex: state.currentGameIndex,
        lastUpdated: state.lastUpdated
      })
    }
  )
);