import { useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../config/firebase';
import { useStatStore } from '../store/statStore';
import { useGameStore } from '../store/gameStore';
import { StatState } from '../types/stats';

export const useStatSync = () => {
  const store = useStatStore();
  const { currentGameId } = useGameStore();
  const isUpdatingRef = useRef(false);
  const dbRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Update database reference when game changes
  useEffect(() => {
    if (!currentGameId) {
      // Clean up previous listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    dbRef.current = ref(database, `stats/${currentGameId}`);
  }, [currentGameId]);

  useEffect(() => {
    if (!currentGameId || !dbRef.current) return;

    const statsRef = dbRef.current;

    // Listen for changes from Firebase
    const handleDataChange = (snapshot: any) => {
      if (isUpdatingRef.current) return;
      
      const data = snapshot.val();
      if (!data) return;

      console.log('Received Stats Firebase update:', data);
      isUpdatingRef.current = true;

      try {
        const currentState = useStatStore.getState();

        // Update store with received state - only update if values are different
        if (data.team1Players && JSON.stringify(data.team1Players) !== JSON.stringify(currentState.team1Players)) {
          // Direct state update for complex objects
          useStatStore.setState({ team1Players: data.team1Players });
        }

        if (data.team2Players && JSON.stringify(data.team2Players) !== JSON.stringify(currentState.team2Players)) {
          useStatStore.setState({ team2Players: data.team2Players });
        }

        if (data.statEvents && JSON.stringify(data.statEvents) !== JSON.stringify(currentState.statEvents)) {
          useStatStore.setState({ statEvents: data.statEvents });
        }

        if (data.team1Stats && JSON.stringify(data.team1Stats) !== JSON.stringify(currentState.team1Stats)) {
          useStatStore.setState({ team1Stats: data.team1Stats });
        }

        if (data.team2Stats && JSON.stringify(data.team2Stats) !== JSON.stringify(currentState.team2Stats)) {
          useStatStore.setState({ team2Stats: data.team2Stats });
        }

        if (data.currentGameId !== undefined && data.currentGameId !== currentState.currentGameId) {
          store.setCurrentGameId(data.currentGameId);
        }

        if (data.isLinkedMode !== undefined && data.isLinkedMode !== currentState.isLinkedMode) {
          useStatStore.setState({ isLinkedMode: data.isLinkedMode });
        }

        if (data.lastUpdated !== undefined && data.lastUpdated !== currentState.lastUpdated) {
          store.updateLastUpdated();
        }
      } catch (error) {
        console.error('Error updating Stats store from Firebase:', error);
      }

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    };

    // Start listening
    const unsubscribe = onValue(statsRef, handleDataChange, (error) => {
      console.error('Stats Firebase listener error:', error);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      // Clean up listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentGameId, store]);

  const emitUpdate = useCallback(async (state: StatState) => {
    if (isUpdatingRef.current || !currentGameId || !dbRef.current) return;

    try {
      console.log('Emitting Stats update to Firebase:', state);
      
      // Create a clean state object
      const cleanState = {
        team1Players: state.team1Players,
        team2Players: state.team2Players,
        statEvents: state.statEvents,
        team1Stats: state.team1Stats,
        team2Stats: state.team2Stats,
        currentGameId: state.currentGameId,
        isLinkedMode: state.isLinkedMode,
        lastUpdated: Date.now()
      };

      await set(dbRef.current, cleanState);
      console.log('Successfully updated Stats Firebase');
    } catch (error) {
      console.error('Error updating Stats Firebase:', error);
    }
  }, []);

  return { emitUpdate };
};