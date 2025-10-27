import { NextRequest, NextResponse } from 'next/server';

// --- Interface Setup (Matches Frontend) ---
interface WeatherData {
    cityName: string;
    temperature: number; // Sticking to number for easier manipulation
    description: string;
    windMph: number;
    lastUpdated: string; // Time string
    source: 'cache' | 'api';
}

interface CacheEntry {
    data: WeatherData;
    timestamp: number;
}

// 🌬️ Constant for converting km/h (Open-Meteo default) to mph
const KMH_TO_MPH = 0.621371;

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

const weatherCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// --- ENVIRONMENT VARIABLES (Only need client token) ---
const PUBLIC_TOKEN_FOR_VALIDATION = process.env.CLIENT_TOKEN;
// Note: EXTERNAL_API_KEY is removed as Open-Meteo is free.


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

    // 2. Check Cache
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData && (currentTime - cachedData.timestamp) < CACHE_DURATION_MS) {
        console.log(`Cache hit for city: ${city}`);
        return NextResponse.json({ ...cachedData.data, source: 'cache' }, { status: 200 });
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
            windMph: Math.round(current.windspeed * KMH_TO_MPH * 10) / 10,
            lastUpdated: current.time,
            source: 'api',
        };

        weatherCache.set(cacheKey, { data: TransformedData, timestamp: currentTime });

        // 6. Return Response
        return NextResponse.json(TransformedData, { status: 200 });
            
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Fatal Error] Processing request for ${city}: ${errorMessage}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}