import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// --- Global Variables provided by the execution environment ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// --- Core Initialization Logic (Singleton Management) ---

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isInitialized = false;

/**
 * Generates the correct Firestore path for a public, shared collection.
 * This structure adheres to the required security rules for public data.
 * Path: /artifacts/{appId}/public/data/{collectionName}
 * @param collectionName The name of the specific collection (e.g., 'weather_cache').
 * @param appId The application identifier (__app_id).
 * @returns The full Firestore collection path string.
 */
export function getPublicCollectionPath(collectionName: string, appId: string): string {
    const safeAppId = appId || 'default-app-id'; // Fallback for safety
    return `artifacts/${safeAppId}/public/data/${collectionName}`;
}

/**
 * Initializes Firebase (if not already done), authenticates the user, and 
 * returns the Firestore context. This ensures the database connection is a singleton.
 * * This function replaces the previous 'initializeFirebase' export.
 * @returns {Promise<{db: Firestore, appId: string, userId: string}>} The Firestore instance and necessary context.
 */
export async function getFirebaseContext(): Promise<{ db: Firestore, appId: string, userId: string }> {
  const configAppId = firebaseConfig.appId || firebaseConfig.projectId || 'default-nextjs-app';
  
  if (isInitialized && getApps().length > 0) {
    // If already initialized, return existing instances
    return {
        db, 
        appId: configAppId,
        userId: auth.currentUser?.uid || 'anonymous-user' 
    };
  }

    // Check for required configuration
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error("Firebase Initialization Error: API Key or Project ID is missing from environment variables.");
      throw new Error('Could not connect to database services due to missing configuration.');
  }
  
  try {
    
    // 2. Initialize App and Services
    if (getApps().some((a: FirebaseApp) => a.name === configAppId)) {
      app = getApp(configAppId);
    } else {
      app = initializeApp(firebaseConfig, configAppId);
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    
    await signInAnonymously(auth);
    
    // Check if sign-in was successful
    if (!auth.currentUser) {
      throw new Error("Authentication failed: No user is currently signed in.");
    }
    
    isInitialized = true;
    
    const userId = auth.currentUser.uid;
    
    // Return the initialized Firestore instance, App ID, and User ID
    return { db, appId: configAppId, userId };

  } catch (error) {
    console.error("Firebase authentication and initialization failed:", error);
    // Log the error and re-throw
    throw new Error('Could not connect to database services.');
  }
}