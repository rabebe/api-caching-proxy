'use client';

// ### START SECTION: IMPORTS & INTERFACE ###
import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
    Search, MapPin, Wind, Loader, Cloud, Zap, Clock, 
    Thermometer, Sun, Moon, Droplet, List, RotateCcw
} from 'lucide-react';

// Environment variable containing the API token (used for authentication)
const CLIENT_API_TOKEN = process.env.NEXT_PUBLIC_CLIENT_TOKEN;

interface WeatherData {
  cityName: string;
  country: string;
  temperature: number; 
  description: string; 
  windKmh: number;
  lastUpdated: string; 
  source: 'cache' | 'api';
  error?: string;
  
  // Detailed fields
  apparentTemperature: number;
  windGusts: number;
  cloudCover: number;
  isDay: number; // 1 for day, 0 for night
  humidity: number;
  tempMax: number;
  tempMin: number;
}
// --- HELPER FUNCTIONS (Moved outside WeatherPage for stability) ---
const formattedLastUpdated = (lastUpdated: string) => {
    return new Date(lastUpdated).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
    });
};

const getWeatherIcon = (description: string, isDay: number) => {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('clear')) return isDay === 1 
      ? <Sun className="w-12 h-12 text-yellow-500" /> 
      : <Moon className="w-12 h-12 text-indigo-500" />;
      
    if (lowerDesc.includes('rain') || lowerDesc.includes('drizzle')) return <Droplet className="w-12 h-12 text-blue-400" />;
    if (lowerDesc.includes('snow') || lowerDesc.includes('hail')) return <Cloud className="w-12 h-12 text-gray-400" />;
    if (lowerDesc.includes('thunderstorm')) return <Zap className="w-12 h-12 text-yellow-600" />;
    if (lowerDesc.includes('cloud') || lowerDesc.includes('overcast')) return <Cloud className="w-12 h-12 text-gray-500" />;
    
    return <Cloud className="w-12 h-12 text-gray-500" />;
};


// --- Search Form (Moved outside and memoized) ---
interface SearchFormProps {
    city: string;
    setCity: (city: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    loading: boolean;
}
const SearchForm: React.FC<SearchFormProps> = React.memo(({ city, setCity, handleSubmit, loading }) => (
    <form onSubmit={handleSubmit} className="flex space-x-2 w-full">
        <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city (e.g., London, Tokyo)"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-sm text-lg text-gray-900" 
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
));
SearchForm.displayName = 'SearchForm';


// --- Introduction View  ---
interface IntroViewProps extends SearchFormProps {
    error: string | null; // To display errors from failed first searches
}
const IntroView: React.FC<IntroViewProps> = React.memo(({ error, ...props }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Sun className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
        <Link
        href="/"
        onClick={() => window.location.reload()}
        className="text-3xl font-bold text-gray-800 mb-4 cursor-pointer hover:text-blue-600 transition duration-150 block"
        title="Click to refresh and reset the application"
        >
            Welcome to the Caching Weather Client
        </Link>        <p className="text-gray-600 mb-8 max-w-sm">
            Enter a city name to get the current weather. Subsequent searches for the same city within 5 minutes will be served instantly from the **Firestore Cache**!
        </p>

        {/* Error Display for Intro View */}
        {error && (
            <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg w-full max-w-sm" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <div className="w-full max-w-sm">
            <SearchForm {...props} />
        </div>
    </div>
));
IntroView.displayName = 'IntroView';

// --- Instructions Panel (For 2-column view after reset) ---
const InstructionsPanel: React.FC = React.memo(() => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl text-center min-h-[400px] border border-gray-200">
        <Sun className="w-16 h-16 text-yellow-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Continue Your Weather Search</h3>
        <p className="text-gray-600 max-w-sm">
            Enter a new city name above to get live weather data, or select a previous search result from the Search Log on the right!
        </p>
    </div>
));
InstructionsPanel.displayName = 'InstructionsPanel';

// --- History Log  ---
interface HistoryLogProps {
    searchedCities: WeatherData[];
    weather: WeatherData | null;
    setWeather: (data: WeatherData) => void;
    // ADDED: Function to trigger a fresh search, respecting cache rules
    fetchWeather: (city: string) => Promise<void>; 
}
// Destructure fetchWeather
const HistoryLog: React.FC<HistoryLogProps> = React.memo(({ searchedCities, weather, fetchWeather }) => (
    <div className="bg-gray-800 text-white rounded-xl p-4 md:p-6 shadow-xl h-full flex flex-col">
        <h2 className="text-xl font-bold mb-4 flex items-center border-b border-gray-700 pb-2">
            <List className="w-5 h-5 mr-2 text-blue-400" /> Search History
        </h2>
        
        {searchedCities.length === 0 ? (
            <p className="text-gray-400 text-sm">Start searching for cities to build your history log!</p>
        ) : (
            <div className="space-y-3 overflow-y-auto max-h-[80vh] custom-scrollbar">
                {searchedCities.map((data, index) => (
                    <div 
                        key={index} 
                        className={`p-3 rounded-lg cursor-pointer transition duration-150 border 
                            ${weather?.cityName.toLowerCase() === data.cityName.toLowerCase() 
                                ? 'bg-blue-600 border-blue-400 shadow-md' 
                                : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                            }`}
                        // UPDATED: Call fetchWeather to re-fetch/re-validate cache
                        onClick={() => fetchWeather(data.cityName)} 
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-md font-semibold">{data.cityName}</h3>
                            
                            <span className="text-sm font-bold">{data.temperature ?? 0}°C</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-1 text-gray-300">
                            <p className="flex items-center">
                                {data.source === 'cache' ? 'CACHED' : 'LIVE'}
                            </p>
                            <p>{formattedLastUpdated(data.lastUpdated)}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
));
HistoryLog.displayName = 'HistoryLog';


// --- Current Weather Card (Detailed Display)  ---
interface CurrentWeatherCardProps {
    weather: WeatherData;
    // Flag to show the loading overlay
    loading: boolean; 
}
// Destructure 'loading' prop
const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = React.memo(({ weather, loading }) => (
    <div className="bg-white border-2 border-blue-500 p-6 rounded-xl shadow-xl transition-all duration-300 w-full relative">
        
        {/* Spinner Overlay to prevent layout shift */}
        {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
                <div className="flex flex-col items-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-blue-700 font-semibold">Refreshing data...</p>
                </div>
            </div>
        )}

        {/* All content in a div to reduce opacity when loading */}
        <div className={loading ? 'opacity-30 transition-opacity duration-300' : ''}>
            
            {/* Source Tag & Last Updated Time */}
            <div className="flex justify-between items-center mb-4">
                <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full 
                    ${weather.source === 'cache' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`
                }>
                    {weather.source === 'cache' ? 'Cache Hit' : 'External Fetch'}
                </span>
                <p className="flex items-center text-gray-500 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Updated: {formattedLastUpdated(weather.lastUpdated)}
                </p>
            </div>
            
            {/* City Name and Country */}
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                <MapPin className="w-7 h-7 mr-2 text-red-500" /> 
                
                {/* Display City, Country */}
                {weather.cityName},
                {/* UPDATED: Removed explicit font size/weight from span to inherit H2 style */}
                <span className="ml-1">
                    {weather.country}
                </span>
            </h2>

            {/* Temperature & Icon */}
            <div className="flex justify-between items-center mb-4">
                {getWeatherIcon(weather.description, weather.isDay)}

                {/* Temperature Display (Using ?? 0 for safety) */}
                <p className="text-7xl font-light text-blue-600">
                    {weather.temperature ?? 0}
                    <span className="align-top text-5xl">°C</span>
                </p>
            </div>
            
            {/* Detailed Conditions */}
            <div className="space-y-3 pt-3 border-t">
                
                <p className="flex items-center text-gray-700 text-lg">
                    <Cloud className="w-5 h-5 text-gray-500 mr-3" />
                    Condition: {weather.description}
                </p>
                
                <p className="flex items-center text-gray-700 text-lg">
                    <Thermometer className="w-5 h-5 text-red-400 mr-3" />
                    Feels Like: {weather.apparentTemperature ?? 0}°C <span className="ml-4 text-sm text-gray-500">
                        (Max: {weather.tempMax ?? 0}°C / Min: {weather.tempMin ?? 0}°C)
                    </span>
                </p>

                <p className="flex items-center text-gray-700 text-lg">
                    <Wind className="w-5 h-5 text-gray-500 mr-3" />
                    Wind:{weather.windKmh ?? 0} km/h (Gusts: {weather.windGusts ?? 0} km/h)
                </p>
                
                <div className="grid grid-cols-2 gap-3 text-gray-700 text-lg pt-2 border-t">
                    <p className="flex items-center">
                        <Cloud className="w-5 h-5 text-blue-400 mr-3" />
                        Clouds: {weather.cloudCover ?? 0}%
                    </p>
                    <p className="flex items-center">
                        <Droplet className="w-5 h-5 text-blue-400 mr-3" />
                        Humidity: {weather.humidity ?? 0}%
                    </p>
                </div>
                
                <p className="flex items-center text-gray-700 text-lg pt-2 border-t mt-3">
                    {weather.isDay === 1 ? (
                        <Sun className="w-5 h-5 text-yellow-500 mr-3" />
                    ) : (
                        <Moon className="w-5 h-5 text-indigo-500 mr-3" />
                    )}
                    Status: {weather.isDay === 1 ? 'Daytime' : 'Nighttime'}
                </p>
            </div>
        </div>
    </div>
));
CurrentWeatherCard.displayName = 'CurrentWeatherCard';


// Day Sky Elements
const DaySkyElements: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        {/* The Sun: Smaller disc with a softer glow in the top right, indicating daylight is present but not necessarily brilliant. */}
        <div className="absolute top-5 right-20 w-16 h-16 rounded-full bg-yellow-400 shadow-[0_0_25px_8px_rgba(252,211,77,0.5)] z-0">
        </div>

        {/* Clouds: Simple white shapes layered to look fluffy and cover more area, representing a typical sky. */}
        <div className="absolute inset-0 opacity-80 z-0">
            {/* Cloud 1 (Top Left - Larger) */}
            <div className="absolute top-[15%] left-[5%] w-64 h-12 bg-white rounded-full opacity-80 shadow-md">
                <div className="absolute w-16 h-16 bg-white rounded-full -top-3 left-10"></div>
                <div className="absolute w-20 h-20 bg-white rounded-full -top-6 left-28"></div>
            </div>
            
            {/* Cloud 2 (Mid Right - Medium) */}
            <div className="absolute top-1/2 right-[10%] w-48 h-10 bg-white rounded-full opacity-70 shadow-lg">
                 <div className="absolute w-12 h-12 bg-white rounded-full -top-1 right-10"></div>
                 <div className="absolute w-8 h-8 bg-white rounded-full -top-1 right-20"></div>
            </div>

            {/* Cloud 3 (Bottom Left - Small) */}
             <div className="absolute bottom-[20%] left-10 w-36 h-8 bg-white rounded-full opacity-60 shadow-sm">
                <div className="absolute w-12 h-12 bg-white rounded-full -top-3 left-5"></div>
            </div>
             
             {/* Cloud 4 (Top Center - Wispy) */}
             <div className="absolute top-5 right-1/3 w-40 h-6 bg-white rounded-full opacity-60 shadow-sm">
                <div className="absolute w-10 h-10 bg-white rounded-full -top-2 left-10"></div>
            </div>
        </div>
    </div>
);
DaySkyElements.displayName = 'DaySkyElements';


// Night Sky Elements
const NightSkyElements: React.FC = () => (
    // Must be absolute to sit above the background and below the main content card.
    // pointer-events-none ensures user can click through to the main content.
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        {/* The Moon: A simple white circle with a shadow */}
        <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full bg-white shadow-[0_0_15px_5px_rgba(255,255,255,0.4)] transition-all duration-1000">
            {/* The Crescent Cutout: A dark circle layered on top and offset to create the crescent shape */}
            {/* The color must match the darkest part of the background gradient (bg-gray-900/to-black) */}
            <div className="absolute top-0 right-0 w-14 h-14 rounded-full bg-gray-900 translate-x-3 translate-y-3"></div>
        </div>

        {/* Stars: A set of absolutely positioned, subtly animated dots */}
        <div className="absolute inset-0 opacity-70">
            {/* Top Left */}
            <span className="absolute w-1 h-1 bg-white rounded-full opacity-50 top-[10%] left-[5%] animate-pulse duration-1000 delay-100"></span>
            <span className="absolute w-[2px] h-[2px] bg-white rounded-full opacity-70 top-[3%] left-[15%]"></span>
            
            {/* Top Right */}
            <span className="absolute w-1 h-1 bg-white rounded-full opacity-70 top-[25%] right-[10%] animate-pulse duration-1000 delay-300"></span>
            <span className="absolute w-[3px] h-[3px] bg-white rounded-full opacity-60 top-[5%] right-[25%]"></span>
            
            {/* Bottom Left */}
            <span className="absolute w-1 h-1 bg-white rounded-full opacity-60 bottom-[20%] left-[30%] animate-pulse duration-1000 delay-500"></span>
            <span className="absolute w-[2px] h-[2px] bg-white rounded-full opacity-40 bottom-[10%] left-[5%]"></span>

            {/* Bottom Right */}
            <span className="absolute w-1 h-1 bg-white rounded-full opacity-40 top-[50%] left-[70%] animate-pulse duration-1000 delay-700"></span>
            <span className="absolute w-[3px] h-[3px] bg-white rounded-full opacity-80 bottom-[5%] right-[50%] animate-pulse duration-1000 delay-900"></span>
            <span className="absolute w-[2px] h-[2px] bg-white rounded-full opacity-50 top-[70%] right-[30%]"></span>
        </div>
    </div>
);
NightSkyElements.displayName = 'NightSkyElements';


const WeatherPage = () => {

  // ### START SECTION: STATE MANAGEMENT ###
  const [city, setCity] = useState('');
  // Holds the weather data for the CURRENTLY viewed city
  const [weather, setWeather] = useState<WeatherData | null>(null); 
  // Holds the history of all successfully searched cities
  const [searchedCities, setSearchedCities] = useState<WeatherData[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ### END SECTION: STATE MANAGEMENT ###

  // ### START SECTION: ASYNC DATA FETCHING LOGIC (STABLE) ###
  const fetchWeather = useCallback(async (searchCity: string) => {
    setLoading(true);
    setError(null);
    // REMOVED: setWeather(null); // Clear previous result while loading. We now keep old data visible to prevent CLS.

    if (!searchCity || searchCity.trim() === '') {
      setError('Please enter a city name.');
      setLoading(false);
      return;
    }

    if (!CLIENT_API_TOKEN) {
        setError('Configuration Error: Client API Token is missing. Please check NEXT_PUBLIC_CLIENT_TOKEN.');
        setLoading(false);
        return;
    }
    
    const url = `/api/weather?city=${encodeURIComponent(searchCity.trim())}`; 

    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': CLIENT_API_TOKEN,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }
      
      const newWeatherData: WeatherData = data;
      setWeather(newWeatherData);
      
      // Update Search History Log (Ensure uniqueness, most recent first)
      setSearchedCities(prevCities => {
        // 1. Filter out the city if it already exists
        const filteredCities = prevCities.filter(
          c => c.cityName.toLowerCase() !== newWeatherData.cityName.toLowerCase()
        );
        // 2. Prepend the new result
        return [newWeatherData, ...filteredCities];
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // App Reset Handler (Clears current view, keeps history)
  const resetApp = useCallback(() => {
    setCity('');
    setWeather(null);
    setLoading(false);
    setError(null);
  }, []);
  
  // Full Reset Handler (Clears view AND history/cache log)
  const clearHistory = useCallback(() => {
    setSearchedCities([]);
    resetApp();
  }, [resetApp]);
  
  // NOTE: recheckLastCity function removed as its dedicated button was removed per user request.

  // Form Submission Handler (Memoized) ###
  // Use useCallback to ensure handleSubmit is stable and doesn't cause unnecessary re-renders in children.
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setError('Please enter a city name.');
      setCity('');
      return
    }
    // Set the city state to the trimmed city for consistency
    setCity(trimmedCity); 
    fetchWeather(trimmedCity);
  }, [city, fetchWeather]);
    
  // If history is empty, the IntroView is shown, handling loading/error internally.
  const isIntroMode = searchedCities.length === 0;

  // Props object for easier passing to sub-components
  const searchFormProps = useMemo(() => ({
    city,
    setCity,
    handleSubmit,
    loading,
    error // Pass error state to IntroView
  }), [city, handleSubmit, loading, error]); // UPDATED: Add error dependency

  // Dynamic Background Class
  const isDaytime = weather?.isDay === 1;
  
  // Base classes for the outer container
  // Added 'relative' to allow absolute children (sun, moon, stars, clouds) to be positioned correctly
  const baseOuterClasses = 'min-h-screen flex items-center justify-center p-4 font-[Inter] transition-all duration-1000 relative';
  
  let outerBgClass = 'bg-gray-50'; // Default light gray background
  
  if (!isIntroMode && weather) {
      // If we have history AND current weather data, apply the dynamic theme
      if (isDaytime) {
          // Sunny Day Theme: Light blue/sky gradient
          outerBgClass = 'bg-gradient-to-br from-blue-100 to-sky-300';
      } else {
          // Night Time Theme: Dark blue/deep space gradient
          outerBgClass = 'bg-gradient-to-br from-gray-900 via-indigo-900 to-black';
      }
  } else if (!isIntroMode && !weather) {
      // If history exists but 'Home' was clicked and no weather is selected, keep a neutral background
      outerBgClass = 'bg-gray-100'; 
  }

  return (
    // 1. Outer Container (Full page background and centering)
    // Apply the dynamically determined class
    <div className={`${baseOuterClasses} ${outerBgClass}`}>
        
        {/* Conditionally render day sky elements */}
        {weather && isDaytime && (
            <DaySkyElements />
        )}
        
        {/* Conditionally render night sky elements */}
        {weather && !isDaytime && (
            <NightSkyElements />
        )}
        
        {isIntroMode ? (
            // Full-width card with description and search form (Only shown when history is completely empty)
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 md:p-8 border border-gray-100 z-10">
                <IntroView {...searchFormProps} />
            </div>
        ) : (
            // Grid layout with main content and history log (Shown when history has any entries)
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
                
                {/* COLUMN 1 & 2: MAIN WEATHER CONTENT */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 border border-gray-100">
                        
                        {/* HEADER AND CLEAR VIEW BUTTON */}
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-extrabold text-gray-800 flex items-center">
                                <Zap className="w-6 h-6 text-blue-600 mr-2" /> 
                                Weather Dashboard
                            </h2>
                            
                            {/* Action Button: Clear Current View (The old resetApp functionality) */}
                            <button 
                                onClick={resetApp}
                                className="text-sm font-semibold text-gray-500 hover:text-blue-500 transition-colors px-3 py-1 rounded-md border border-gray-300 hover:border-blue-500 flex items-center"
                                aria-label="Clear current view"
                            >
                                <RotateCcw className="w-4 h-4 mr-1"/> Clear View
                            </button>
                        </div>
                        
                        <div className="mb-6">
                            <SearchForm {...searchFormProps} />
                        </div>
                        
                        {/* Show error message if fetch fails, but allow the old weather card to remain visible. */}
                        {error && !loading && (
                            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4" role="alert">
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        
                        {/* If weather data exists, show the detailed card AND action buttons. */}
                        {weather && (
                            <>
                                <CurrentWeatherCard 
                                    weather={weather} 
                                    loading={loading} 
                                />
                                
                                {/* Instructions and Reset Info at the bottom of the Card */}
                                <div className="mt-6 pt-4 border-t border-gray-200 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                    <p className="mb-2">
                                        To **continue searching** for a different city, use the search bar above or select a city from the **Search History** log on the right.
                                    </p>
                                    <p className="flex items-center">
                                        To **reset** the application and return to the first page without any saved history, click 
                                        <button 
                                            onClick={clearHistory}
                                            disabled={loading}
                                            className="text-red-600 font-bold hover:text-red-800 transition-colors ml-1 disabled:text-red-300 underline p-0 m-0 bg-transparent border-none cursor-pointer"
                                            aria-label="Full application reset, clearing history"
                                        >
                                            here to perform a full reset.
                                        </button>
                                    </p>
                                </div>
                            </>
                        )}
                        
                        {/* If weather is null (after Clear View click) AND history exists, show the InstructionsPanel */}
                        {!weather && searchedCities.length > 0 && (
                            <InstructionsPanel />
                        )}
                    </div>
                </div>

                {/* History Log */}
                <div className="md:col-span-1">
                    <HistoryLog 
                        searchedCities={searchedCities} 
                        weather={weather} 
                        setWeather={setWeather} 
                        // ADDED: Pass the fetchWeather function for re-validation/re-fetch
                        fetchWeather={fetchWeather} 
                    />
                </div>
            </div>
        )}
    </div>
  );
};

export default WeatherPage;
