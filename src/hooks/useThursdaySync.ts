import { useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import { database } from '../config/firebase';
import { useThursdayStore } from '../store/thursdayStore';
import { ThursdayModeState } from '../types/thursday';

export const useThursdaySync = (roomId: string = 'default-room') => {
  const store = useThursdayStore();
  const isUpdatingRef = useRef(false);
  const dbRef = useRef(ref(database, `thursday/${roomId}`));
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Update database reference when room changes
  useEffect(() => {
    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    dbRef.current = ref(database, `thursday/${roomId}`);
  }, [roomId]);

  useEffect(() => {
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
      if (error.code === 'PERMISSION_DENIED') {
        console.warn('Thursday mode data access denied. Please check Firebase database rules.');
        console.warn('Add this rule to your Firebase Realtime Database:');
        console.warn(`{
  "rules": {
    "thursday": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}`);
      } else {
        console.error('Thursday Firebase listener error:', error);
      }
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
  }, []);

  return { emitUpdate };
};