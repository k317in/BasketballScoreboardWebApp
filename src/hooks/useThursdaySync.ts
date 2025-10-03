import { useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, DatabaseReference, DataSnapshot } from 'firebase/database';
import { database } from '../config/firebase';
import { useThursdayStore } from '../store/thursdayStore';
import { useAuthStore } from '../store/authStore';
import { ThursdayModeState } from '../types/thursday';

export const useThursdaySync = (roomId: string = 'default-room') => {
  const store = useThursdayStore();
  const { isAuthenticated, isTable } = useAuthStore();
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
      dbRef.current = ref(database, `thursday/${roomId}`);
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

    const thursdayRef = dbRef.current;

    // Listen for changes from Firebase
    const handleDataChange = (snapshot: DataSnapshot) => {
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
  }, [roomId, store]);

  const emitUpdate = useCallback(async (state: ThursdayModeState) => {
    if (isUpdatingRef.current) return;

    // Only allow updates if user is authenticated and has table permissions
    if (!isAuthenticated || !isTable) {
      console.warn('Cannot update Thursday Firebase: User not authenticated or lacks table permissions');
      return;
    }

    // Skip Firebase update if database is not available
    if (!database || !dbRef.current) {
      console.warn('Firebase update skipped - running in local-only mode');
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