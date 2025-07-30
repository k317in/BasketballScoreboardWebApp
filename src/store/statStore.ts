import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StatState, Player, StatEvent, TeamStats, StatType, PlayerStatSummary, GameExportData } from '../types/stats';

interface StatStore extends StatState {
  // Player management
  addPlayer: (teamId: 1 | 2, name: string, jerseyNumber: string, position: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Omit<Player, 'id' | 'teamId'>>) => void;
  removePlayer: (playerId: string) => void;
  clearTeamRoster: (teamId: 1 | 2) => void;
  importPlayersFromThursday: (team1Name: string, team1Players: any[], team2Name: string, team2Players: any[]) => void;
  
  // Stat recording
  recordStat: (playerId: string, statType: StatType, value: number, gameTime: number, period: number) => void;
  undoLastStat: () => void;
  clearStatHistory: () => void;
  
  // Team stats
  updateTeamTimeouts: (teamId: 1 | 2, increment: number) => void;
  updateTeamFouls: (teamId: 1 | 2, increment: number) => void;
  updatePeriodScore: (teamId: 1 | 2, period: number, score: number) => void;
  
  // Game management
  setCurrentGameId: (gameId: string | null) => void;
  toggleLinkedMode: () => void;
  resetGameStats: () => void;
  
  // Data export and analysis
  getPlayerStats: (playerId: string) => PlayerStatSummary;
  getAllPlayerStats: () => PlayerStatSummary[];
  getTeamTotalStats: (teamId: 1 | 2) => PlayerStatSummary;
  exportGameData: (team1Name: string, team2Name: string, finalScore: string) => GameExportData;
  
  // Utility
  updateLastUpdated: () => void;
}

const defaultTeamStats: TeamStats = {
  teamId: 1,
  timeoutsUsed: 0,
  fouls: 0,
  scorePerPeriod: {}
};

export const useStatStore = create<StatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      team1Players: [],
      team2Players: [],
      statEvents: [],
      team1Stats: { ...defaultTeamStats, teamId: 1 },
      team2Stats: { ...defaultTeamStats, teamId: 2 },
      currentGameId: null,
      isLinkedMode: true,
      lastUpdated: 0,

      // Player management
      addPlayer: (teamId, name, jerseyNumber, position) => {
        const newPlayer: Player = {
          id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          jerseyNumber,
          position,
          teamId
        };

        set((state) => ({
          [`team${teamId}Players`]: [...state[`team${teamId}Players` as keyof StatState] as Player[], newPlayer],
          lastUpdated: Date.now()
        }));
      },

      updatePlayer: (playerId, updates) => {
        set((state) => {
          const updateTeamPlayers = (players: Player[]) =>
            players.map(player => 
              player.id === playerId ? { ...player, ...updates } : player
            );

          return {
            team1Players: updateTeamPlayers(state.team1Players),
            team2Players: updateTeamPlayers(state.team2Players),
            lastUpdated: Date.now()
          };
        });
      },

      removePlayer: (playerId) => {
        set((state) => ({
          team1Players: state.team1Players.filter(p => p.id !== playerId),
          team2Players: state.team2Players.filter(p => p.id !== playerId),
          lastUpdated: Date.now()
        }));
      },

      clearTeamRoster: (teamId) => {
        set((state) => ({
          [`team${teamId}Players`]: [],
          lastUpdated: Date.now()
        }));
      },

      importPlayersFromThursday: (team1Name, team1Players, team2Name, team2Players) => {
        const convertPlayers = (players: any[], teamId: 1 | 2): Player[] =>
          players.map((player, index) => ({
            id: `thursday_${teamId}_${index}_${Date.now()}`,
            name: player.name || `Player ${index + 1}`,
            jerseyNumber: (index + 1).toString(),
            position: player.position || 'Player',
            teamId
          }));

        set({
          team1Players: convertPlayers(team1Players, 1),
          team2Players: convertPlayers(team2Players, 2),
          lastUpdated: Date.now()
        });
      },

      // Stat recording
      recordStat: (playerId, statType, value, gameTime, period) => {
        const state = get();
        const player = [...state.team1Players, ...state.team2Players].find(p => p.id === playerId);
        
        if (!player) return;

        const newStatEvent: StatEvent = {
          id: `stat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          playerId,
          playerName: player.name,
          teamId: player.teamId,
          statType,
          value,
          gameTime,
          period,
          systemTimestamp: Date.now(),
          gameId: state.currentGameId || undefined
        };

        set((state) => ({
          statEvents: [...state.statEvents, newStatEvent],
          lastUpdated: Date.now()
        }));
      },

      undoLastStat: () => {
        set((state) => ({
          statEvents: state.statEvents.slice(0, -1),
          lastUpdated: Date.now()
        }));
      },

      clearStatHistory: () => {
        set({
          statEvents: [],
          lastUpdated: Date.now()
        });
      },

      // Team stats
      updateTeamTimeouts: (teamId, increment) => {
        set((state) => ({
          [`team${teamId}Stats`]: {
            ...state[`team${teamId}Stats` as keyof StatState] as TeamStats,
            timeoutsUsed: Math.max(0, (state[`team${teamId}Stats` as keyof StatState] as TeamStats).timeoutsUsed + increment)
          },
          lastUpdated: Date.now()
        }));
      },

      updateTeamFouls: (teamId, increment) => {
        set((state) => ({
          [`team${teamId}Stats`]: {
            ...state[`team${teamId}Stats` as keyof StatState] as TeamStats,
            fouls: Math.max(0, (state[`team${teamId}Stats` as keyof StatState] as TeamStats).fouls + increment)
          },
          lastUpdated: Date.now()
        }));
      },

      updatePeriodScore: (teamId, period, score) => {
        set((state) => ({
          [`team${teamId}Stats`]: {
            ...state[`team${teamId}Stats` as keyof StatState] as TeamStats,
            scorePerPeriod: {
              ...(state[`team${teamId}Stats` as keyof StatState] as TeamStats).scorePerPeriod,
              [period]: score
            }
          },
          lastUpdated: Date.now()
        }));
      },

      // Game management
      setCurrentGameId: (gameId) => {
        set({ currentGameId: gameId, lastUpdated: Date.now() });
      },

      toggleLinkedMode: () => {
        set((state) => ({ 
          isLinkedMode: !state.isLinkedMode, 
          lastUpdated: Date.now() 
        }));
      },

      resetGameStats: () => {
        set({
          statEvents: [],
          team1Stats: { ...defaultTeamStats, teamId: 1 },
          team2Stats: { ...defaultTeamStats, teamId: 2 },
          lastUpdated: Date.now()
        });
      },

      // Data export and analysis
      getPlayerStats: (playerId) => {
        const state = get();
        const player = [...state.team1Players, ...state.team2Players].find(p => p.id === playerId);
        const playerEvents = state.statEvents.filter(event => event.playerId === playerId);

        const stats: PlayerStatSummary = {
          playerId,
          playerName: player?.name || 'Unknown Player',
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          freeThrows: 0,
          threePointers: 0,
          totalStats: 0
        };

        playerEvents.forEach(event => {
          switch (event.statType) {
            case 'points':
              stats.points += event.value;
              break;
            case 'rebounds':
              stats.rebounds += event.value;
              break;
            case 'assists':
              stats.assists += event.value;
              break;
            case 'steals':
              stats.steals += event.value;
              break;
            case 'blocks':
              stats.blocks += event.value;
              break;
            case 'turnovers':
              stats.turnovers += event.value;
              break;
            case 'free_throws':
              stats.freeThrows += event.value;
              break;
            case 'three_pointers':
              stats.threePointers += event.value;
              break;
          }
          stats.totalStats += event.value;
        });

        return stats;
      },

      getAllPlayerStats: () => {
        const state = get();
        const allPlayers = [...state.team1Players, ...state.team2Players];
        return allPlayers.map(player => get().getPlayerStats(player.id));
      },

      getTeamTotalStats: (teamId) => {
        const state = get();
        const teamPlayers = state[`team${teamId}Players` as keyof StatState] as Player[];
        const teamEvents = state.statEvents.filter(event => event.teamId === teamId);

        const teamStats: PlayerStatSummary = {
          playerId: `team${teamId}`,
          playerName: `Team ${teamId} Total`,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          freeThrows: 0,
          threePointers: 0,
          totalStats: 0
        };

        teamEvents.forEach(event => {
          switch (event.statType) {
            case 'points':
              teamStats.points += event.value;
              break;
            case 'rebounds':
              teamStats.rebounds += event.value;
              break;
            case 'assists':
              teamStats.assists += event.value;
              break;
            case 'steals':
              teamStats.steals += event.value;
              break;
            case 'blocks':
              teamStats.blocks += event.value;
              break;
            case 'turnovers':
              teamStats.turnovers += event.value;
              break;
            case 'free_throws':
              teamStats.freeThrows += event.value;
              break;
            case 'three_pointers':
              teamStats.threePointers += event.value;
              break;
          }
          teamStats.totalStats += event.value;
        });

        return teamStats;
      },

      exportGameData: (team1Name, team2Name, finalScore) => {
        const state = get();
        
        return {
          gameInfo: {
            gameId: state.currentGameId,
            team1Name,
            team2Name,
            finalScore,
            periods: Math.max(...state.statEvents.map(e => e.period), 1),
            duration: `${Math.max(...state.statEvents.map(e => e.gameTime), 0)} seconds`,
            exportTimestamp: Date.now()
          },
          players: [...state.team1Players, ...state.team2Players],
          statEvents: state.statEvents,
          teamStats: [state.team1Stats, state.team2Stats],
          playerSummaries: get().getAllPlayerStats()
        };
      },

      updateLastUpdated: () => {
        set({ lastUpdated: Date.now() });
      }
    }),
    {
      name: 'basketball-stats',
      partialize: (state) => ({
        team1Players: state.team1Players,
        team2Players: state.team2Players,
        statEvents: state.statEvents,
        team1Stats: state.team1Stats,
        team2Stats: state.team2Stats,
        currentGameId: state.currentGameId,
        isLinkedMode: state.isLinkedMode,
        lastUpdated: state.lastUpdated
      })
    }
  )
);