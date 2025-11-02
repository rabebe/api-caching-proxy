import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// --- Global Variables provided by the execution environment ---
// IMPORTANT: These variables are injected at runtime and are mandatory for connection.

// The Firebase configuration object (parsed from a JSON string)
declare const __firebase_config: string; 

// The initial custom authentication token for the current user
declare const __initial_auth_token: string | undefined;

// The unique identifier for the current application artifact
declare const __app_id: string; 

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
  if (isInitialized) {
    // If already initialized, return existing instances
    return {
        db, 
        appId: typeof __app_id !== 'undefined' ? __app_id : 'default-app-id',
        userId: auth.currentUser?.uid || 'anonymous-user' 
    };
  }

  // 1. Parse configuration
  const firebaseConfig = JSON.parse(__firebase_config);
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  // 2. Initialize App and Services
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  try {
    // 3. Authenticate the user
    if (typeof __initial_auth_token !== 'undefined') {
      // Use the custom token if provided (preferred for authenticated users)
      await signInWithCustomToken(auth, __initial_auth_token);
    } else {
      // Sign in anonymously if no token is available
      await signInAnonymously(auth);
    }
    
    // Check if sign-in was successful
    if (!auth.currentUser) {
        throw new Error("Authentication failed: No user is currently signed in.");
    }

    isInitialized = true;
    
    const userId = auth.currentUser.uid;
    
    // Return the initialized Firestore instance, App ID, and User ID
    return { db, appId, userId };

  } catch (error) {
    console.error("Firebase authentication and initialization failed:", error);
    // Log the error and re-throw
    throw new Error('Could not connect to database services.');
  }
}