import { NextApiRequest, NextApiResponse } from 'next';

// --- IN-MEMORY CACHE-SETUP ---
interface WeatherData {
    city: string;
    temperature: number;
    description: string;
    windMph: number;
    lastUpdated: number;
}

// Define Cache Entry Structure
interface CacheEntry {
    data: WeatherData;
    timestamp: number;
}

// Using a Simple Map for in-memory caching
const weatherCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 10 minutes TTL

// --- CLIENT AUTHENTICATION ---
const CLIENT_SECRET_TOKEN = process.env.CLIENT_SECRET_TOKEN

// --- EXTERNAL API SETUP ---
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;
const EXTERNAL_API_URL = 'https://api.openweathermap.org/v1/current.json';

// Main API Handler Function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 1. Validate API Key from Client
    const clientKey = req.headers['x-api-key'];
    if (clientKey !== CLIENT_SECRET_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    // Ensure the external key is available
    if (!EXTERNAL_API_KEY) {
        console.error('Missing EXTERNAL_API_KEY in environment variables');
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Extract city parameter
    const { city } = req.query;
    if (!city || typeof city !== 'string') {
        return res.status(400).json({ error: 'Bad Request: Missing or invalid city parameter' });
    }
    const cacheKey = city.toLowerCase().trim();
    const currentTime = Date.now();

    // 2. Check Cache
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData && (currentTime - cachedData.timestamp) < CACHE_DURATION_MS) {
        console.log(`Cache hit for city: ${city}`);
        // Return cached data wtih source indication
        return res.status(200).json({ ...cachedData.data, source: 'cache' });
    }

    // 3. Fetch from External API
    console.log(`[Fetch] Cache miss for city: ${city}. Fetching from external API.`);
    try {
        const fetchUrl = `${EXTERNAL_API_URL}?key=${EXTERNAL_API_KEY}&q=${encodeURIComponent(city)}`;

        // Use exponential backoff for fetch retries
        const maxRetries = 3;
        let apiResponse: Response | null = null;

        for (let i = 0; i < maxRetries; i++) {
            try {
                apiResponse = await fetch(fetchUrl);
                if (apiResponse.ok) {
                    break; // Exit loop on success
                }
            // Only retry for network errors or 5xx responses
                if (apiResponse.status >= 400 && apiResponse.status < 500) {
                    break;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Retry ${i + 1} failed for city: ${city}: ${errorMessage}`);
                // Wait before retrying
                await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
            }
        }
        if (!apiResponse || !apiResponse.ok) {
            const errorText = apiResponse ? await apiResponse.text() : 'No response from server';
            console.error(`Failed to fetch weather data: ${errorText}`);
            return res.status(502).json({ error: 'Bad Gateway: Failed to fetch data from external API' });
        }

        const weatherData = await apiResponse.json();

        // 4. Store in Cache

        const TransformedData = {
            city: weatherData.location.name,
            temperature: weatherData.current.temperature,
            description: weatherData.current.condition.text,
            windMph: weatherData.current.wind_mph,
            lastUpdated: weatherData.current.last_updated,
        };

        weatherCache.set(cacheKey, { data: TransformedData, timestamp: currentTime });

        // 5. Return Response with source indication
        return res.status(200).json({ ...TransformedData, source: 'api' });
            
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Fatal Error] Processing request for ${city}: ${errorMessage}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}