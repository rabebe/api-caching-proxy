import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseContext, getPublicCollectionPath } from './firebase';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 min TTL

export async function getCachedData<T>(key: string, collectionName: string): Promise<CacheEntry<T> | null> {
  try {
    const { db, appId } = await getFirebaseContext();
    const cachePath = getPublicCollectionPath(collectionName, appId);
    const docRef = doc(db, cachePath, key.toLowerCase());
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const cached = docSnap.data() as CacheEntry<T>;
    return cached;
  } catch (err) {
    console.error('Cache read error:', err);
    return null;
  }
}

export async function setCachedData<T>(key: string, collectionName: string, data: T): Promise<void> {
  try {
    const { db, appId } = await getFirebaseContext();
    const cachePath = getPublicCollectionPath(collectionName, appId);
    const docRef = doc(db, cachePath, key.toLowerCase());
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    await setDoc(docRef, entry);
  } catch (err) {
    console.error('Cache write error:', err);
  }
}

export function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}
