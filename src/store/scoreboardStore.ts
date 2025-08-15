import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScoreboardState, Team, GameSettings } from '../types/scoreboard';

const defaultGameSettings: GameSettings = {
  gameDuration: 12, // 12 minutes per period
  periodCount: 4,
  shotClockDuration: 24,
  shotClockEnabled: true,
  foulCountEnabled: true,
  timeoutsPerTeam: 7 // Default NBA timeouts
};

const defaultTeam: Team = {
  name: 'Team',
  score: 0,
  fouls: 0,
  timeouts: 7, // Default NBA timeouts
  color: '#3b82f6'
};

interface ScoreboardStore extends ScoreboardState {
  // Team actions
  updateTeamName: (teamNumber: 1 | 2, name: string) => void;
  updateTeamScore: (teamNumber: 1 | 2, increment: number) => void;
  updateTeamFouls: (teamNumber: 1 | 2, increment: number) => void;
  updateTeamTimeouts: (teamNumber: 1 | 2, increment: number) => void;
  updateTeamColor: (teamNumber: 1 | 2, color: string) => void;
  updateTeamLogo: (teamNumber: 1 | 2, logo?: string) => void;
  
  // Game actions
  setPeriod: (period: number) => void;
  setGameTime: (time: number) => void;
  setShotClockTime: (time: number) => void;
  toggleGameClock: () => void;
  toggleShotClock: () => void;
  resetGameClock: () => void;
  resetShotClock: () => void;
  
  // Settings
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  toggleMode: () => void;
  toggleFullscreen: () => void;
  toggleProportionalBanners: () => void;
  
  // Reset
  resetGame: () => void;
  resetGameData: () => void; // Reset only game data, keep team names
}

export const useScoreboardStore = create<ScoreboardStore>()(
  persist(
    (set, get) => ({
      // Initial state
      team1: { ...defaultTeam, name: 'Home', timeouts: defaultGameSettings.timeoutsPerTeam },
      team2: { ...defaultTeam, name: 'Away', timeouts: defaultGameSettings.timeoutsPerTeam },
      period: 1,
      gameTime: defaultGameSettings.gameDuration * 60, // Convert to seconds
      shotClockTime: defaultGameSettings.shotClockDuration,
      isGameRunning: false,
      isShotClockRunning: false,
      gameSettings: defaultGameSettings,
      isFullMode: true,
      isFullscreen: false,
      showProportionalBanners: true,

      // Team actions
      updateTeamName: (teamNumber, name) =>
        set((state) => ({
          [`team${teamNumber}`]: { ...state[`team${teamNumber}` as keyof ScoreboardState] as Team, name }
        })),

      updateTeamScore: (teamNumber, increment) =>
        set((state) => {
          const team = state[`team${teamNumber}` as keyof ScoreboardState] as Team;
          return {
            [`team${teamNumber}`]: { ...team, score: Math.max(0, team.score + increment) }
          };
        }),

      updateTeamFouls: (teamNumber, increment) =>
        set((state) => {
          const team = state[`team${teamNumber}` as keyof ScoreboardState] as Team;
          return {
            [`team${teamNumber}`]: { ...team, fouls: Math.max(0, team.fouls + increment) }
          };
        }),

      updateTeamColor: (teamNumber, color) =>
        set((state) => ({
          [`team${teamNumber}`]: { ...state[`team${teamNumber}` as keyof ScoreboardState] as Team, color }
        })),

      updateTeamLogo: (teamNumber, logo) =>
        set((state) => ({
          [`team${teamNumber}`]: { ...state[`team${teamNumber}` as keyof ScoreboardState] as Team, logo }
        })),

      updateTeamTimeouts: (teamNumber, increment) =>
        set((state) => {
          const team = state[`team${teamNumber}` as keyof ScoreboardState] as Team;
          const { gameSettings } = state;
          const currentTimeouts = team.timeouts || 0;
          const newTimeouts = currentTimeouts + increment;
          const maxTimeouts = gameSettings.timeoutsPerTeam || 0;
          return {
            [`team${teamNumber}`]: { 
              ...team, 
              timeouts: Math.max(0, Math.min(maxTimeouts, newTimeouts))
            }
          };
        }),

      // Game actions
      setPeriod: (period) => set({ period }),
      setGameTime: (time) => set({ gameTime: time }),
      setGameTimeMs: (ms) => set({ gameTimeMs: ms }),
      setShotClockTime: (time) => set({ shotClockTime: time }),
      toggleGameClock: () => set((state) => ({ isGameRunning: !state.isGameRunning })),
      toggleShotClock: () => set((state) => ({ isShotClockRunning: !state.isShotClockRunning })),
      
      resetGameClock: () => {
        const { gameSettings } = get();
        set({ gameTime: gameSettings.gameDuration * 60, isGameRunning: false });
      },
      
      resetShotClock: () => {
        const { gameSettings } = get();
        set({ shotClockTime: gameSettings.shotClockDuration });
      },

      // Settings
      updateGameSettings: (settings) =>
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...settings }
        })),

      toggleMode: () => set((state) => ({ isFullMode: !state.isFullMode })),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      toggleProportionalBanners: () => set((state) => ({ showProportionalBanners: !state.showProportionalBanners })),

      // Reset
      resetGame: () => {
        const { gameSettings } = get();
        set({
          team1: { ...defaultTeam, name: 'Home', color: '#eab308', timeouts: gameSettings.timeoutsPerTeam }, // Yellow color
          team2: { ...defaultTeam, name: 'Away', timeouts: gameSettings.timeoutsPerTeam },
          period: 1,
          gameTime: gameSettings.gameDuration * 60,
          shotClockTime: gameSettings.shotClockDuration,
          isGameRunning: false,
          isShotClockRunning: false
        });
      },

      // Reset only game data, keep team names and colors
      resetGameData: () => {
        const { gameSettings, team1, team2 } = get();
        set({
          team1: { 
            ...team1, 
            score: 0, 
            fouls: 0, 
            timeouts: gameSettings.timeoutsPerTeam 
          },
          team2: { 
            ...team2, 
            score: 0, 
            fouls: 0, 
            timeouts: gameSettings.timeoutsPerTeam 
          },
          period: 1,
          gameTime: gameSettings.gameDuration * 60,
          gameTimeMs: 0,
          shotClockTime: gameSettings.shotClockDuration,
          isGameRunning: false,
          isShotClockRunning: false
        });
      }
    }),
    {
      name: 'basketball-scoreboard',
      partialize: (state) => ({
        team1: state.team1,
        team2: state.team2,
        gameSettings: state.gameSettings,
        isFullMode: state.isFullMode,
        showProportionalBanners: state.showProportionalBanners
      })
    }
  )
);