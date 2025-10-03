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
  
  // Wins tracking
  getTeamWins: (teamName: string) => number;
  getAllTeamWins: () => Record<string, number>;
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

      updateGameResult: (gameIndex: number, result: string) => {
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
      },

      // Wins tracking
      getTeamWins: (teamName) => {
        const { schedule } = get();
        let wins = 0;
        
        schedule.forEach(game => {
          if (game.result) {
            const scoreParts = game.result.split('-');
            if (scoreParts.length === 2) {
              const homeScore = parseInt(scoreParts[0].trim());
              const awayScore = parseInt(scoreParts[1].trim());
              
              if (homeScore > awayScore && game.homeTeam === teamName) {
                wins++;
              } else if (awayScore > homeScore && game.awayTeam === teamName) {
                wins++;
              }
            }
          }
        });
        
        return wins;
      },

      getAllTeamWins: () => {
        const { teams, getTeamWins } = get();
        const wins: Record<string, number> = {};
        
        teams.forEach(team => {
          wins[team.teamName] = getTeamWins(team.teamName);
        });
        
        return wins;
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