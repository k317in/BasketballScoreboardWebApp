import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  // Replace these with your actual Firebase config
  apiKey: "AIzaSyDuy3N3TU4-Ubhe4RvqS36yWj6ohI9hEj4",
  authDomain: "scoreboard-app-fd8b4.firebaseapp.com",
  databaseURL: "https://scoreboard-app-fd8b4-default-rtdb.firebaseio.com",
  projectId: "scoreboard-app-fd8b4",
  storageBucket: "scoreboard-app-fd8b4.firebasestorage.app",
  messagingSenderId: "1024693657653",
  appId: "1:1024693657653:web:fb59422c6a1906fa7c117c",
  measurementId: "G-XYZ9G8KVYQ"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Analytics (only in production)
let analytics;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;