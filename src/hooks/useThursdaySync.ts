import { useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import { database } from '../config/firebase';
import { useThursdayStore } from '../store/thursdayStore';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { ThursdayModeState } from '../types/thursday';

export const useThursdaySync = () => {
  const store = useThursdayStore();
  const { isAuthenticated, isTable } = useAuthStore();
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

    dbRef.current = ref(database, `thursday/${currentGameId}`);
  }, [currentGameId]);

  useEffect(() => {
    if (!currentGameId || !dbRef.current) return;

    const thursdayRef = dbRef.current;

    // Listen for changes from Firebase
    const handleDataChange = (snapshot: any) => {
      if (isUpdatingRef.current) return;
      
      const data = snapshot.val();
      if (!data) return;

      console.log('Received Thursday Firebase update:', data);
      isUpdatingRef.current = true;

      try {
        const currentState = useThursdayStore.getState();

        // Update store with received state - only update if values are different
        if (data.isEnabled !== undefined && data.isEnabled !== currentState.isEnabled) {
          if (data.isEnabled) {
            store.enableThursdayMode();
          } else {
            store.disableThursdayMode();
          }
        }

        if (data.teams && JSON.stringify(data.teams) !== JSON.stringify(currentState.teams)) {
          store.setTeams(data.teams);
        }

        if (data.schedule && JSON.stringify(data.schedule) !== JSON.stringify(currentState.schedule)) {
          store.setSchedule(data.schedule);
        }

        if (data.currentGameIndex !== undefined && data.currentGameIndex !== currentState.currentGameIndex) {
          store.setCurrentGameIndex(data.currentGameIndex);
        }

        if (data.lastUpdated !== undefined && data.lastUpdated !== currentState.lastUpdated) {
          store.updateLastUpdated();
        }
      } catch (error) {
        console.error('Error updating Thursday store from Firebase:', error);
      }

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    };

    // Start listening
    const unsubscribe = onValue(thursdayRef, handleDataChange, (error) => {
      console.error('Thursday Firebase listener error:', error);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      // Clean up listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentGameId, store]);

  const emitUpdate = useCallback(async (state: ThursdayModeState) => {
    if (isUpdatingRef.current || !currentGameId || !dbRef.current) return;

    // Only allow updates if user is authenticated and has table permissions
    if (!isAuthenticated || !isTable) {
      console.warn('Cannot update Thursday Firebase: User not authenticated or lacks table permissions');
      return;
    }

    try {
      console.log('Emitting Thursday update to Firebase:', state);
      
      // Create a clean state object
      const cleanState = {
        isEnabled: state.isEnabled,
        teams: state.teams,
        schedule: state.schedule,
        currentGameIndex: state.currentGameIndex,
        lastUpdated: Date.now()
      };

      await set(dbRef.current, cleanState);
      console.log('Successfully updated Thursday Firebase');
    } catch (error) {
      console.error('Error updating Thursday Firebase:', error);
    }
  }, [isAuthenticated, isTable]);

  return { emitUpdate };
};