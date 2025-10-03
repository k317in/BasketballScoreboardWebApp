import { useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, DatabaseReference, DataSnapshot } from 'firebase/database';
import { database } from '../config/firebase';
import { useScoreboardStore } from '../store/scoreboardStore';
import { ScoreboardState } from '../types/scoreboard';

export const useFirebaseSync = (roomId: string = 'default-room') => {
  const store = useScoreboardStore();
  const isUpdatingRef = useRef(false);
  const dbRef = useRef<ReturnType<typeof ref> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Update database reference when room changes
  useEffect(() => {
    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Only set up Firebase if database is available
    if (database) {
      dbRef.current = ref(database, `scoreboards/${roomId}`);
    } else {
      console.warn('Firebase database not available - running in local-only mode');
      dbRef.current = null;
    }
  }, [roomId]);

  useEffect(() => {
    // Skip Firebase setup if database is not available
    if (!database || !dbRef.current) {
      console.warn('Firebase sync disabled - running in local-only mode');
      return;
    }

    const scoreboardRef = dbRef.current;

    // Listen for changes from Firebase
    const handleDataChange = (snapshot: DataSnapshot) => {
      if (isUpdatingRef.current) return;
      
      const data = snapshot.val();
      if (!data) return;

      console.log('Received Firebase update:', data);
      isUpdatingRef.current = true;

      try {
        // Get current state
        const currentState = useScoreboardStore.getState();

        // Update store with received state - only update if values are different
        if (data.team1) {
          if (data.team1.name !== currentState.team1.name) {
            store.updateTeamName(1, data.team1.name);
          }
          if (data.team1.color !== currentState.team1.color) {
            store.updateTeamColor(1, data.team1.color);
          }
          if (data.team1.logo !== currentState.team1.logo) {
            store.updateTeamLogo(1, data.team1.logo);
          }
          if (data.team1.score !== currentState.team1.score) {
            const scoreDiff = data.team1.score - currentState.team1.score;
            store.updateTeamScore(1, scoreDiff);
          }
          if (data.team1.fouls !== currentState.team1.fouls) {
            const foulsDiff = data.team1.fouls - currentState.team1.fouls;
            store.updateTeamFouls(1, foulsDiff);
          }
          if (data.team1.timeouts !== undefined && data.team1.timeouts !== currentState.team1.timeouts) {
            const timeoutsDiff = data.team1.timeouts - currentState.team1.timeouts;
            store.updateTeamTimeouts(1, timeoutsDiff);
          }
        }

        if (data.team2) {
          if (data.team2.name !== currentState.team2.name) {
            store.updateTeamName(2, data.team2.name);
          }
          if (data.team2.color !== currentState.team2.color) {
            store.updateTeamColor(2, data.team2.color);
          }
          if (data.team2.logo !== currentState.team2.logo) {
            store.updateTeamLogo(2, data.team2.logo);
          }
          if (data.team2.score !== currentState.team2.score) {
            const scoreDiff = data.team2.score - currentState.team2.score;
            store.updateTeamScore(2, scoreDiff);
          }
          if (data.team2.fouls !== currentState.team2.fouls) {
            const foulsDiff = data.team2.fouls - currentState.team2.fouls;
            store.updateTeamFouls(2, foulsDiff);
          }
          if (data.team2.timeouts !== undefined && data.team2.timeouts !== currentState.team2.timeouts) {
            const timeoutsDiff = data.team2.timeouts - currentState.team2.timeouts;
            store.updateTeamTimeouts(2, timeoutsDiff);
          }
        }

        if (data.period !== undefined && data.period !== currentState.period) {
          store.setPeriod(data.period);
        }

        if (data.gameTime !== undefined && data.gameTime !== currentState.gameTime) {
          store.setGameTime(data.gameTime);
        }

        if (data.shotClockTime !== undefined && data.shotClockTime !== currentState.shotClockTime) {
          store.setShotClockTime(data.shotClockTime);
        }

        if (data.isGameRunning !== undefined && data.isGameRunning !== currentState.isGameRunning) {
          if (data.isGameRunning && !currentState.isGameRunning) {
            store.toggleGameClock();
          } else if (!data.isGameRunning && currentState.isGameRunning) {
            store.toggleGameClock();
          }
        }

        if (data.isShotClockRunning !== undefined && data.isShotClockRunning !== currentState.isShotClockRunning) {
          if (data.isShotClockRunning && !currentState.isShotClockRunning) {
            store.toggleShotClock();
          } else if (!data.isShotClockRunning && currentState.isShotClockRunning) {
            store.toggleShotClock();
          }
        }

        if (data.gameSettings) {
          store.updateGameSettings(data.gameSettings);
        }

        if (data.isFullMode !== undefined && data.isFullMode !== currentState.isFullMode) {
          store.toggleMode();
        }

        if (data.showProportionalBanners !== undefined && data.showProportionalBanners !== currentState.showProportionalBanners) {
          store.toggleProportionalBanners();
        }
      } catch (error) {
        console.error('Error updating store from Firebase:', error);
      }

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    };

    // Start listening
    const unsubscribe = onValue(scoreboardRef, handleDataChange, (error) => {
      console.error('Firebase listener error:', error);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      // Clean up listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [roomId, store]);

  const emitUpdate = useCallback(async (state: ScoreboardState) => {
    if (isUpdatingRef.current) return;

    // Skip Firebase update if database is not available
    if (!database || !dbRef.current) {
      console.warn('Firebase update skipped - running in local-only mode');
      return;
    }

    try {
      console.log('Emitting update to Firebase:', state);
      
      // Create a clean state object without functions
      const cleanState = {
        team1: {
          name: state.team1.name,
          score: state.team1.score,
          fouls: state.team1.fouls,
          timeouts: state.team1.timeouts,
          color: state.team1.color,
          logo: state.team1.logo || null
        },
        team2: {
          name: state.team2.name,
          score: state.team2.score,
          fouls: state.team2.fouls,
          timeouts: state.team2.timeouts,
          color: state.team2.color,
          logo: state.team2.logo || null
        },
        period: state.period,
        gameTime: state.gameTime,
        shotClockTime: state.shotClockTime,
        isGameRunning: state.isGameRunning,
        isShotClockRunning: state.isShotClockRunning,
        gameSettings: state.gameSettings,
        isFullMode: state.isFullMode,
        showProportionalBanners: state.showProportionalBanners,
        timestamp: Date.now()
      };

      await set(dbRef.current, cleanState);
      console.log('Successfully updated Firebase');
    } catch (error) {
      console.error('Error updating Firebase:', error);
    }
  }, []);

  return { emitUpdate };
};