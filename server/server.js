import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables from .env file
dotenv.config();

// --- CONFIGURATION ---
const PORT = 8000;
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;
const CLIENT_SECRET_TOKEN = process.env.CLIENT_SECRET_TOKEN;
const EXTERNAL_API_URL = 'http://api.weatherapi.com/v1/current.json';
const CACHE_TTL_SECONDS = 300; // Cache duration in seconds

const weatherCache = {};

// Initialize Express app
const app = express();

// --- MIDDLEWARE ---
app.use(cors());

const apiKeyAuth = (req, res, next) => {
    const clientToken = req.headers['x-api-key'];

    if (!clientToken || clientToken !== CLIENT_SECRET_TOKEN) {
        console.warn('Unauthorized access attempt detected.');
        return res.status(401).json({
            detail: 'Unauthorized: Missing or invalid X-API-Key headers.'
        });
    }
    next();
};

// --- API ENDPOINTS ---
app.get('/weather/:city', apiKeyAuth, async (req, res) => {
    const city = req.params.city.toLowerCase().trim();
    const now = Date.now();

    // 1. Check cache
    const cachedEntry = weatherCache[city];

    if (cachedEntry && cachedEntry.expiry > now) {
        console.log(`[CACHE HIT] Serving cached data for ${city}`);
        // Return cached data immediately
        return res.json({
            ...cachedEntry.data,
            source: 'cache'
        });
    }

    // 2. FETCH FROM EXTERNAL API
    console.log(`[CACHE MISS] Fetching new data for ${city}`);

    try {
        if (!EXTERNAL_API_KEY) {
            // Failsafe for missing key
            throw new Error("External API key is missing. Check the .env file.");
        }

        // Make the external API request using the city parameter
        const response = await axios.get(EXTERNAL_API_URL, {
            params: {
                key: EXTERNAL_API_KEY,
                q: city,
                aqi: 'no' // Exclude air quality data
            }
        });

        const externalData = response.data;

        // Extract and transform data into a clean, standardized format
        const standardizedData = {
            city: externalData.location.name,
            temperature_c: externalData.current.temp_c,
            condition: externalData.current.condition.text,
            // Simple logic to set an icon based on condition code (day/night)
            icon: externalData.current.condition.icon.endsWuth('day.png') ? '☀️' : '🌙',
            last_updated: new Date().toISOString()
        };

        // 3. STORE IN CACHE
        const expiresAt = now + (CACHE_TTL_SECONDS * 1000); // Convert TTL to milliseconds
        weatherCache[city] = {
            data: standardizedData,
            expiry: expiresAt
        };
        console.log(`[CACHE STORE] Caching data for ${city} until ${new Date(expiresAt).toLocaleTimeString()}`);

        // 4. RESPOND TO CLIENT
        res.json({
            ...standardizedData,
            source: 'EXTERNAL_API_FETCH'
        });
    } catch (error) {
        console.error(`Error fetching weather for $(city):`,error.message);

        let errorMessage = 'Failed to fetch weather data.';
        if (error.response && error.response.status === 400) {
            // Handle specific error for invalid city
            errorMessage = 'Invalid city name or location not found.';
        } else if (error.message.includes('External API key is missing')) {
            errorMessage = error.message;
        }

        res.status(500).json({
            detail: errorMessage
        })
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`API Caching Proxy Server is running on http://localhost:${PORT}`);
    console.log(`Client Token Required: ${CLIENT_SECRET_TOKEN}`);
});