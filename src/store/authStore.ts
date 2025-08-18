import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, set, get, onValue } from 'firebase/database';
import { auth, database } from '../config/firebase';

export type UserRole = 'guest' | 'table' | 'pending';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isTable: boolean;
  isGuest: boolean;
  isPending: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, requestedRole: 'guest' | 'table') => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  clearError: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      isTable: false,
      isGuest: false,
      isPending: false,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Get user role from database
          const userRoleRef = ref(database, `users/${firebaseUser.uid}/role`);
          const roleSnapshot = await get(userRoleRef);
          const role = roleSnapshot.val() || 'guest';
          
          // Get user name from database
          const userNameRef = ref(database, `users/${firebaseUser.uid}/name`);
          const nameSnapshot = await get(userNameRef);
          const name = nameSnapshot.val() || firebaseUser.email?.split('@')[0] || 'User';
          
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name,
            role
          };
          
          set({
            user,
            firebaseUser,
            isAuthenticated: true,
            isTable: role === 'table',
            isGuest: role === 'guest',
            isPending: role === 'pending',
            loading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.message || 'Login failed' 
          });
          throw error;
        }
      },

      signup: async (email: string, password: string, name: string, requestedRole: 'guest' | 'table') => {
        set({ loading: true, error: null });
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          // Set role to 'pending' if requesting table access, otherwise 'guest'
          const role = requestedRole === 'table' ? 'pending' : 'guest';
          
          // Store user data in database
          await set(ref(database, `users/${firebaseUser.uid}`), {
            name,
            email,
            role,
            requestedRole,
            createdAt: Date.now()
          });
          
          const user: User = {
            id: firebaseUser.uid,
            email,
            name,
            role
          };
          
          set({
            user,
            firebaseUser,
            isAuthenticated: true,
            isTable: role === 'table',
            isGuest: role === 'guest',
            isPending: role === 'pending',
            loading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            loading: false, 
            error: error.message || 'Signup failed' 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({
          user: null,
          firebaseUser: null,
          isAuthenticated: false,
          isTable: false,
          isGuest: false,
          isPending: false,
          error: null
        });
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
          isTable: user?.role === 'table',
          isGuest: user?.role === 'guest',
          isPending: user?.role === 'pending'
        });
      },

      setFirebaseUser: (firebaseUser: FirebaseUser | null) => {
        set({ firebaseUser });
      },

      clearError: () => {
        set({ error: null });
      },

      initializeAuth: () => {
        set({ loading: true });
        
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              // Get user role and name from database
              const userRoleRef = ref(database, `users/${firebaseUser.uid}/role`);
              const userNameRef = ref(database, `users/${firebaseUser.uid}/name`);
              
              const [roleSnapshot, nameSnapshot] = await Promise.all([
                get(userRoleRef),
                get(userNameRef)
              ]);
              
              const role = roleSnapshot.val() || 'guest';
              const name = nameSnapshot.val() || firebaseUser.email?.split('@')[0] || 'User';
              
              const user: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name,
                role
              };
              
              set({
                user,
                firebaseUser,
                isAuthenticated: true,
                isTable: role === 'table',
                isGuest: role === 'guest',
                isPending: role === 'pending',
                loading: false
              });
            } catch (error) {
              console.error('Error fetching user data:', error);
              set({ loading: false });
            }
          } else {
            set({
              user: null,
              firebaseUser: null,
              isAuthenticated: false,
              isTable: false,
              isGuest: false,
              isPending: false,
              loading: false
            });
          }
        });
        
        return unsubscribe;
      }
    }),
    {
      name: 'basketball-auth',
      partialize: (state) => ({
        // Don't persist auth state - let Firebase handle it
      })
    }
  )
);