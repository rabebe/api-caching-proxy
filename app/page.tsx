'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, MapPin, Wind, Loader, Cloud, Zap, Clock } from 'lucide-react';

const CLIENT_API_TOKEN = process.env.NEXT_PUBLIC_CLIENT_TOKEN;

interface WeatherData {
  cityName: string;
  temperature: string;
  condition: string;
  windMph: number;
  lastUpdated: number;
  source: 'cache' | 'api';
  error?: string;
}

const WeatherPage = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (searchCity: string) => {
    setLoading(true);
    setError(null);
    setWeather(null);

    if (!searchCity || searchCity.trim() === '') {
      setError('Please enter a city name.');
      setLoading(false);
      return;
    }
    
    console.log(`[Frontend Fetch] Attempting to fetch city: "${searchCity.trim()}"`);

    const url = `/api/weather?city=${encodeURIComponent(searchCity.trim())}`; 

    // Call the local Next.js API route
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': CLIENT_API_TOKEN || '',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        // Handle error response
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }

      setWeather(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setError('Please enter a city name.');
      setCity('');
      return
    }
    fetchWeather(trimmedCity);
  };

  const formattedLastUpdated = useMemo(() => {
    if (weather?.lastUpdated) {
      // Format the last updated timestamp
      return new Date(weather.lastUpdated).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
      });
    }
    return 'N/A';
  }, [weather]);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-[Inter]">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 md:p-8 border border-gray-100">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
                    <Zap className="w-7 h-7 text-blue-600 mr-2" /> Caching Weather Client
                </h1>

                {/* Search Form */}
                <form onSubmit={handleSubmit} className="flex space-x-2 mb-8">
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Enter city (e.g., London, Tokyo)"
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm text-lg"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 flex items-center justify-center shadow-md disabled:bg-blue-400"
                        disabled={loading}
                        aria-label="Search Weather"
                    >
                        {loading ? <Loader className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                    </button>
                </form>

                {/* Loading / Error / Result Display */}
                {loading && (
                    <div className="flex items-center justify-center p-6 bg-blue-50 text-blue-700 rounded-lg">
                        <Loader className="w-6 h-6 animate-spin mr-3" /> Fetching weather data...
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {weather && (
                    <div className="bg-white border-2 border-blue-500 p-6 rounded-xl shadow-xl transition-all duration-300">
                        {/* Source Tag */}
                        <div className="flex justify-between items-center mb-4">
                            <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full 
                                ${weather.source === 'cache' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`
                            }>
                                {weather.source === 'cache' ? 'Cache Hit' : 'External Fetch'}
                            </span>
                            <p className="flex items-center text-gray-500 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Updated: {formattedLastUpdated}
                            </p>
                        </div>
                        
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                            <MapPin className="w-7 h-7 mr-2 text-red-500" /> {weather.cityName}
                        </h2>
                        
                        <p className="text-7xl font-light text-blue-600 mb-4">{weather.temperature}°C</p>
                        
                        <div className="space-y-3 pt-3 border-t">
                            {/* Condition */}
                            <p className="flex items-center text-gray-700 text-lg">
                                <Cloud className="w-5 h-5 text-gray-500 mr-3" />
                                **Condition:** {weather.condition}
                            </p>

                            {/* Wind Speed */}
                            <p className="flex items-center text-gray-700 text-lg">
                                <Wind className="w-5 h-5 text-gray-500 mr-3" />
                                **Wind Speed:** {weather.windMph} mph
                            </p>
                        </div>
                    </div>
                )}

                {!loading && !error && !weather && (
                    <div className="p-6 bg-gray-100 text-gray-600 rounded-lg text-center text-sm">
                        Use the search bar to query the weather. Search twice in a row to see the **Cache Hit** in action!
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeatherPage;
