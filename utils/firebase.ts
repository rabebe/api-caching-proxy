import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// --- Global Firebase config from environment variables ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// --- Singleton instances ---
let app: FirebaseApp;
let db: Firestore;
let isInitialized = false;

/**
 * Generates the correct Firestore path for a public, shared collection.
 * Path: /artifacts/{appId}/public/data/{collectionName}
 */
export function getPublicCollectionPath(collectionName: string, appId: string): string {
  const safeAppId = appId || 'default-app-id';
  return `artifacts/${safeAppId}/public/data/${collectionName}`;
}

/**
 * Initializes Firebase and returns the Firestore instance.
 */
export async function getFirebaseContext(): Promise<{ db: Firestore; appId: string }> {
  const appId = firebaseConfig.appId || firebaseConfig.projectId || 'default-nextjs-app';

  // Return cached instances if already initialized
  if (isInitialized && getApps().length > 0 && db) {
    return { db, appId };
  }

  // Check for missing config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase Initialization Error: API Key or Project ID missing.");
    throw new Error("Could not connect to Firestore due to missing configuration.");
  }

  try {
    // Use existing app if already initialized
    if (getApps().some(a => a.name === appId)) {
      app = getApp(appId);
      console.log("Firebase app loaded from existing instance:", appId);
    } else {
      app = initializeApp(firebaseConfig, appId);
      console.log("Firebase app initialized:", appId);
    }

    db = getFirestore(app);
    isInitialized = true;

    return { db, appId };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    throw new Error("Could not connect to Firestore.");
  }
}
