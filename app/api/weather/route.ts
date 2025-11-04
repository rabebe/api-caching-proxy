import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore, Timestamp } from 'firebase/firestore';

export const revalidate = 300;

// --- Firebase Configuration from Environment Variables ---
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string | undefined,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string | undefined,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string | undefined,
};

let firestoreInstance: Firestore | null = null;
let firebaseAppInstance: FirebaseApp | null = null;

// 1. Type Guard: Checks if an object is a Firestore Timestamp instance
function isFirestoreTimestamp(value: unknown): value is Timestamp {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    
    const hasToMillis = (value as { toMillis: unknown }).toMillis;
    return typeof hasToMillis === 'function';

}

// 2. Helper to safely get milliseconds regardless of the stored type
function getTimestampInMs(timestamp: number | Timestamp): number {
    if (isFirestoreTimestamp(timestamp)) {
        return timestamp.toMillis();
    }
    // Assume it's already a number (milliseconds since epoch) if not a Timestamp object
    if (typeof timestamp === 'number') {
        return timestamp;
    }
    // Fallback for safety
    return 0;
}

// Internal function to initialize Firebase client SDK safely on the server
function getFirestoreInstance(): Firestore | null {
    if (firestoreInstance) {
        return firestoreInstance;
    }

    try {
        const configAppId = (firebaseConfig.appId || firebaseConfig.projectId || 'default-nextjs-app') as string;

        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.error("FIREBASE CONFIG ERROR: Global variables (__firebase_config or __app_id) are unavailable in this execution context. Skipping Firestore operations.");
            return null;
        }
        
        const existingApps = getApps();
        
        if (existingApps.some((a: FirebaseApp) => a.name === configAppId)) {
            firebaseAppInstance = getApp(configAppId);
        } else {
            firebaseAppInstance = initializeApp(firebaseConfig, configAppId); 
        }
        
        firestoreInstance = getFirestore(firebaseAppInstance);
        return firestoreInstance;

    } catch (e) {
        console.error("Failed to initialize Firebase or parse config:", e);
        return null;
    }
}

// Utility to generate the required public path using the provided global ID
function getPublicCollectionPathLocal(collectionName: string): string {
    const configAppId = (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'default-app-id') as string;
    return `artifacts/${configAppId}/public/data/${collectionName}`;
}

// --- Interface Setup (Matches Frontend) ---
interface WeatherData {
    cityName: string;
    temperature: number; // Sticking to number for easier manipulation
    description: string;
    windKmh: number;
    lastUpdated: string; // Time string
    source: 'cache' | 'api';
}

interface CacheEntry {
    data: Omit<WeatherData, 'source'>;
    timestamp: number;
}


// 🌡️ Simple map for weather codes (Open-Meteo uses WMO codes)
const WEATHER_CODE_MAP: { [key: number]: string } = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing Rime Fog',
    51: 'Drizzle, Light',
    53: 'Drizzle, Moderate',
    55: 'Drizzle, Dense',
    61: 'Rain, Slight',
    63: 'Rain, Moderate',
    65: 'Rain, Heavy',
    71: 'Snow, Slight',
    73: 'Snow, Moderate',
    75: 'Snow, Heavy',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail',
    // (A comprehensive map would be much longer, but this covers the basics)
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// --- ENVIRONMENT VARIABLES (Only need client token) ---
const PUBLIC_TOKEN_FOR_VALIDATION = process.env.CLIENT_TOKEN;

// 🌐 The Route Handler uses search parameters
export async function GET(request: NextRequest) {
    
    // 1. Validate API Key from Client (Security Check remains)
    const clientKey = request.headers.get('x-api-key');
    if (clientKey !== PUBLIC_TOKEN_FOR_VALIDATION) {
        return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    // Extract city parameter
    const city = request.nextUrl.searchParams.get('city'); 
    
    if (!city || typeof city !== 'string') {
        return NextResponse.json({ error: 'Bad Request: Missing city parameter' }, { status: 400 });
    }
    
    const cacheKey = city.toLowerCase().trim();
    const currentTime = Date.now();

    // Initialize Firestore
    const db = getFirestoreInstance();

    // 2. Check Firestore Cache (Replaces in-memory Map check)
    if (db) {
        try {
            const cacheCollectionPath = getPublicCollectionPathLocal('weather_cache');
            console.log(`[Firestore Read] Path being requested: ${cacheCollectionPath}/${cacheKey}`);

            const cacheDocRef = doc(db, cacheCollectionPath, cacheKey);
            const cacheDoc = await getDoc(cacheDocRef);
            
            if (cacheDoc.exists()) {
                const cachedEntry = cacheDoc.data() as CacheEntry;

                const timestampMs = getTimestampInMs(cachedEntry.timestamp);

                
                // Check if the timestamp is within the 5-minute duration
                if ((currentTime - timestampMs) < CACHE_DURATION_MS) {
                    console.log(`Cache hit for city: ${city} (Firestore)`);
                    // Return cached data and explicitly set source to 'cache'
                    return NextResponse.json({ ...cachedEntry.data, source: 'cache' }, { status: 200 });
                }
            }
        } catch (dbError) {
            console.error(`[Firestore Read Error] Failed to read cache for ${city}:`, dbError);
        }
    }

    // --- 3. FETCH: Geocoding (City Name to Lat/Lon) ---
    try {
        const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
        const geocodingFetchUrl = `${GEOCODING_API_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geocodingFetchUrl);
        const geoData = await geoResponse.json();

        if (!geoResponse.ok || !geoData.results || geoData.results.length === 0) {
            return NextResponse.json({ error: `Could not find coordinates for city: ${city}` }, { status: 404 });
        }

        const { latitude, longitude, name: geoCityName } = geoData.results[0];

        // --- 4. FETCH: Weather Data (Lat/Lon to Weather) ---
        const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
        
        // Request current weather and imperial units for wind speed to match frontend 
        // We'll use metric for temperature (Celsius) and convert wind later just in case.
        const weatherFetchUrl = `${WEATHER_API_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

        const weatherResponse = await fetch(weatherFetchUrl);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok || weatherData.error) {
            const errorText = weatherData.reason || 'Failed to retrieve weather data from Open-Meteo.';
            console.error(`Open-Meteo Error: ${errorText}`);
            return NextResponse.json({ error: 'Bad Gateway: Failed to fetch weather data' }, { status: 502 });
        }

        // --- 5. Transform and Cache ---
        const current = weatherData.current_weather;
        
        const TransformedData: WeatherData = {
            cityName: geoCityName,
            temperature: current.temperature, // Already Celsius
            // Map the WMO code to a text description
            description: WEATHER_CODE_MAP[current.weathercode] || 'Unknown Condition', 
            // Convert wind speed from km/h to mph, and round it
            windKmh: Math.round(current.windspeed * 10) / 10,
            lastUpdated: current.time,
            source: 'api',
        };

        // --- 6. Write to Firestore Cache (Replaces in-memory write) ---
        if (db) {
            try {
                // Strip the 'source' field before caching
                const dataWithoutSource: Omit<WeatherData, 'source'> = {
                    cityName: TransformedData.cityName,
                    temperature: TransformedData.temperature,
                    description: TransformedData.description,
                    windKmh: TransformedData.windKmh,
                    lastUpdated: TransformedData.lastUpdated,
                };

                const cacheDocRef = doc(db, getPublicCollectionPathLocal('weather_cache'), cacheKey);
                const dataToCache: CacheEntry = { 
                    data: dataWithoutSource, 
                    timestamp: currentTime 
                };
                
                // Write the new data to Firestore
                await setDoc(cacheDocRef, dataToCache);
            } catch (dbError) {
                console.error(`[Firestore Write Error] Failed to write cache for ${city}:`, dbError);
            }
        }

        // 7. Return Response
        return NextResponse.json(TransformedData, { status: 200 });
            
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Fatal Error] Processing request for ${city}: ${errorMessage}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}