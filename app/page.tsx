'use client';

// ### START SECTION: IMPORTS & INTERFACE ###
import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { 
    Search, MapPin, Wind, Loader, Cloud, Zap, Clock, 
    Thermometer, Sun, Moon, Droplet, List, RotateCcw, Home
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
// --- HELPER FUNCTIONS ---
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
      ? <Sun className="w-16 h-16 text-yellow-400 drop-shadow-lg" /> 
      : <Moon className="w-16 h-16 text-indigo-300 drop-shadow-lg" />;
      
    if (lowerDesc.includes('rain') || lowerDesc.includes('drizzle')) return <Droplet className="w-16 h-16 text-blue-400 drop-shadow-lg" />;
    if (lowerDesc.includes('snow') || lowerDesc.includes('hail')) return <Cloud className="w-16 h-16 text-gray-300 drop-shadow-lg" />;
    if (lowerDesc.includes('thunderstorm')) return <Zap className="w-16 h-16 text-yellow-500 drop-shadow-lg" />;
    if (lowerDesc.includes('cloud') || lowerDesc.includes('overcast')) return <Cloud className="w-16 h-16 text-gray-400 drop-shadow-lg" />;
    
    return <Cloud className="w-16 h-16 text-gray-400 drop-shadow-lg" />;
};


// --- Dynamic Background Weather Icon ---
interface BackgroundIconProps {
    description: string;
    isDay: number;
}

const BackgroundWeatherIcon: React.FC<BackgroundIconProps> = ({ description, isDay }) => {
    const lowerDesc = description.toLowerCase();
    let IconComponent: React.ElementType | null = null;
    let iconColor = 'text-white'; // Default color
    let iconSize = 'w-20 h-20 md:w-32 md:h-32'; // Smaller size
    
    // Choose the appropriate Lucide icon and color based on weather
    if (lowerDesc.includes('clear')) {
        IconComponent = isDay === 1 ? Sun : Moon;
        iconColor = isDay === 1 ? 'text-yellow-300' : 'text-indigo-400';
    } else if (lowerDesc.includes('cloud') || lowerDesc.includes('overcast') || lowerDesc.includes('cloudy')) { // Added 'cloudy' for default intro state
        IconComponent = Cloud;
        iconColor = 'text-gray-400';
    } else if (lowerDesc.includes('rain') || lowerDesc.includes('drizzle')) {
        IconComponent = Droplet; 
        iconColor = 'text-blue-500';
    } else if (lowerDesc.includes('thunderstorm') || lowerDesc.includes('storm')) {
        IconComponent = Zap; 
        iconColor = 'text-yellow-500';
        iconSize = 'w-16 h-16 md:w-24 md:h-24'; // Make thunder slightly smaller
    } else if (lowerDesc.includes('snow') || lowerDesc.includes('hail')) {
        IconComponent = Cloud; 
        iconColor = 'text-white';
    }

    if (!IconComponent) return null;

    // Define positions for the scattered icons
    // These positions are chosen to avoid the center area where the content sits
    const iconPositions = [
        { top: '10%', left: '5%', rotation: 'rotate-12', delay: 'delay-100' },
        { top: '80%', left: '85%', rotation: 'rotate-45', delay: 'delay-200' },
        { top: '30%', left: '70%', rotation: '-rotate-20', delay: 'delay-300' },
        { top: '55%', left: '15%', rotation: 'rotate-60', delay: 'delay-400' },
        { top: '5%', left: '50%', rotation: '-rotate-30', delay: 'delay-500' }, 
        { top: '90%', left: '20%', rotation: 'rotate-70', delay: 'delay-600' },
        { top: '40%', left: '95%', rotation: '-rotate-10', delay: 'delay-700' },
    ];

    return (
        // Renders a container to hold all scattered icons
        <div className="absolute inset-0 z-0 pointer-events-none">
            {iconPositions.map((pos, index) => (
                <div 
                    key={index}
                    // Apply absolute positioning, rotation, and animation classes
                    className={`absolute transition-all duration-1000 ease-in-out ${pos.rotation} ${pos.delay}`}
                    style={{ top: pos.top, left: pos.left }}
                >
                    <IconComponent 
                        // Reduced opacity and dynamic sizing
                        className={`${iconSize} ${iconColor} opacity-30 transition-all duration-1000`} 
                    />
                </div>
            ))}
        </div>
    );
};
// --- END BackgroundWeatherIcon ---

// --- Search Form (Memoized) ---
interface SearchFormProps {
    city: string;
    setCity: (city: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    isIntroMode?: boolean; 
}
const SearchForm: React.FC<SearchFormProps> = React.memo(({ city, setCity, handleSubmit, loading, isIntroMode }) => (
    <form onSubmit={handleSubmit} className="flex space-x-2 w-full max-w-sm mx-auto">
        <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city (e.g., London, Tokyo)"
            className={`flex-grow p-3 rounded-full focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-lg text-lg text-gray-900 
                        ${isIntroMode ? 'bg-white/80 border-2 border-white backdrop-blur-sm' : 'bg-white border border-gray-300'}`} 
            disabled={loading}
            autoComplete="off" 
        />
        <button
            type="submit"
            className={`p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-150 flex items-center justify-center shadow-lg disabled:bg-blue-400
                        ${isIntroMode ? 'border-2 border-blue-700' : ''}`}
            disabled={loading}
            aria-label="Search Weather"
        >
            {loading ? <Loader className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
        </button>
    </form>
));
SearchForm.displayName = 'SearchForm';


// --- Header Component ---
interface HeaderProps {
    clearHistoryAndResetApp: () => void;
    isIntroMode: boolean;
}
const Header: React.FC<HeaderProps> = React.memo(({ clearHistoryAndResetApp, isIntroMode }) => (
    <header className={`sticky top-0 w-full bg-white shadow-lg z-20 ${isIntroMode ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-800">
                Caching Weather Client
            </h1>
            <button
                onClick={clearHistoryAndResetApp} // Use the full reset function here
                className="flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-lg hover:bg-blue-50"
                aria-label="Go to Home Page and Clear History"
            >
                <Home className="w-5 h-5" />
                <span>Home</span>
            </button>
        </div>
    </header>
));
Header.displayName = 'Header';


// --- Footer Component ---
const Footer: React.FC = React.memo(() => (
    <footer className="w-full bg-gray-900 text-white mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Caching Weather Client. All rights reserved.
            <p className="mt-1">
                Data provided by 
                <a 
                href="https://open-meteo.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors underline mx-1"
                aria-label="Open-Meteo website"
                >
                    Open-Meteo
                    </a> 
                    | Powered by 
                <a 
                href="https://firebase.google.com/docs/firestore" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors underline mx-1"
                aria-label="Open-Meteo website"
                >
                    Firestore
                    </a> 
            </p>        </div>
    </footer>
));
Footer.displayName = 'Footer';


// --- Introduction View (Full-screen) ---
interface IntroViewProps extends SearchFormProps {
    error: string | null; 
}
const IntroView: React.FC<IntroViewProps> = React.memo(({ error, ...props }) => (
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-4 text-white z-10 relative"> 

        {/* Enhanced Branding Icon */}
        <div className="relative p-6 rounded-full bg-yellow-100/70 mb-8 border-4 border-yellow-300 transform transition-transform duration-500 hover:scale-105 shadow-xl backdrop-blur-sm">
        <Image 
        src="/favicon.ico" 
        alt="Caching Weather App Logo" 
        className="w-16 h-16 object-contain"
        width={64}
        height={64
        } />
    </div>
        
        <p className="text-white text-opacity-90 mb-8 max-w-sm text-lg drop-shadow-md">
            Enter a city name to get the current weather. Subsequent searches for the same city within 5 minutes will be served from the Firestore Cache.
        </p>

        {/* Error Display for Intro View */}
        {error && (
            <div className="p-4 mb-4 bg-red-100/80 border border-red-400 text-red-700 rounded-lg w-full max-w-sm backdrop-blur-sm" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <div className="w-full max-w-sm">
            <SearchForm {...props} isIntroMode={true} />
        </div>
    </div>
));
IntroView.displayName = 'IntroView';

// --- Instructions Panel (For 2-column view after reset) ---
const InstructionsPanel: React.FC = React.memo(() => (
    <div className="flex flex-col items-center justify-center p-8 bg-white/70 rounded-xl text-center min-h-[400px] border border-blue-300 shadow-xl backdrop-blur-sm">
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
    fetchWeather: (city: string) => Promise<void>; 
}
const HistoryLog: React.FC<HistoryLogProps> = React.memo(({ searchedCities, weather, fetchWeather }) => (
    <div className="bg-gray-800/80 text-white rounded-xl p-4 md:p-6 shadow-xl h-full flex flex-col border border-gray-700 backdrop-blur-sm">
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
                                ? 'bg-blue-600/70 border-blue-400 shadow-md ring-2 ring-blue-300'
                                : 'bg-gray-700/70 hover:bg-gray-600/70 border-gray-600'
                            }`}
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
    loading: boolean; 
}
const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = React.memo(({ weather, loading }) => (
    <div className="bg-white/70 border-2 border-blue-400 p-6 rounded-xl shadow-2xl transition-all duration-300 w-full relative backdrop-blur-sm 
                    ring-4 ring-blue-300 ring-opacity-50 transform hover:scale-[1.005] animate-fade-in">
        
        {/* Spinner Overlay */}
        {loading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                <div className="flex flex-col items-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-blue-700 font-semibold">Refreshing data...</p>
                </div>
            </div>
        )}

        {/* Content Block */}
        <div className={loading ? 'opacity-30 transition-opacity duration-300' : ''}>
            
            {/* Source Tag & Last Updated Time */}
            <div className="flex justify-between items-center mb-4">
                <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full 
                    ${weather.source === 'cache' ? 'bg-green-100/80 text-green-800' : 'bg-yellow-100/80 text-yellow-800'}`
                }>
                    {weather.source === 'cache' ? 'Cache Hit' : 'External Fetch'}
                </span>
                <p className="flex items-center text-gray-700 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Updated: {formattedLastUpdated(weather.lastUpdated)}
                </p>
            </div>
            
            {/* City Name and Country */}
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                <MapPin className="w-7 h-7 mr-2 text-red-500" /> 
                {weather.cityName},
                <span className="ml-1">
                    {weather.country}
                </span>
            </h2>

            {/* Temperature & Icon */}
            <div className="flex justify-between items-center mb-4">
                {getWeatherIcon(weather.description, weather.isDay)}

                <p className="text-7xl font-light text-blue-600">
                    {weather.temperature ?? 0}
                    <span className="align-top text-5xl">°C</span>
                </p>
            </div>
            
            {/* Detailed Conditions */}
            <div className="space-y-3 pt-3 border-t border-gray-300">
                
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
                
                <div className="grid grid-cols-2 gap-3 text-gray-700 text-lg pt-2 border-t border-gray-300">
                    <p className="flex items-center">
                        <Cloud className="w-5 h-5 text-blue-400 mr-3" />
                        Clouds: {weather.cloudCover ?? 0}%
                    </p>
                    <p className="flex items-center">
                        <Droplet className="w-5 h-5 text-blue-400 mr-3" />
                        Humidity: {weather.humidity ?? 0}%
                    </p>
                </div>
                
                <p className="flex items-center text-gray-700 text-lg pt-2 border-t border-gray-300 mt-3">
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


const WeatherPage = () => {

  // ### START SECTION: STATE MANAGEMENT ###
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null); 
  const [searchedCities, setSearchedCities] = useState<WeatherData[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ### END SECTION: STATE MANAGEMENT ###

  // ### START SECTION: ASYNC DATA FETCHING LOGIC (STABLE) ###
  const fetchWeather = useCallback(async (searchCity: string) => {
    setLoading(true);
    setError(null);

    if (!searchCity || searchCity.trim() === '') {
      setError('Please enter a valid city name.');
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
        const filteredCities = prevCities.filter(
          c => c.cityName.toLowerCase() !== newWeatherData.cityName.toLowerCase()
        );
        return [newWeatherData, ...filteredCities];
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // App Reset Handler
  const resetApp = useCallback(() => {
    setCity('');
    setWeather(null);
    setLoading(false);
    setError(null);
  }, []);
  
  // Clears the currently displayed weather card, but keeps the history and stays on the dashboard.
  const clearCurrentView = useCallback(() => {
    setWeather(null);
    setCity(''); // Clear the search bar too
    setLoading(false);
    setError(null);
  }, []);
  
  // Full Reset Handler (Clear History AND Reset App)
  const clearHistoryAndResetApp = useCallback(() => {
    setSearchedCities([]);
    resetApp();
  }, [resetApp]);
  
  // Form Submission Handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setError('Please enter a valid city name.');
      setCity('');
      return
    }
    setCity(trimmedCity); 
    fetchWeather(trimmedCity);
  }, [city, fetchWeather]);
    
  // If history is empty, the IntroView is shown
  const isIntroMode = searchedCities.length === 0;

  // Props object for easier passing to sub-components
  const searchFormProps = useMemo(() => ({
    city,
    setCity,
    handleSubmit,
    loading,
    error 
  }), [city, handleSubmit, loading, error]);

  // Dynamic Background Class Variables
  const isDaytime = weather?.isDay === 1;
  const weatherDescription = weather?.description.toLowerCase() || '';

  const baseOuterClasses = 'min-h-screen flex flex-col font-sans transition-all duration-1000 relative overflow-hidden'; 
  
  let outerBgClass = ''; 
  let backgroundEffectClass = '';
  // Initialize introPatternClass
  let introPatternClass = ''; 

  if (isIntroMode) {
      // Use a static clear sky gradient instead of time-based function
      outerBgClass = 'bg-gradient-to-br from-blue-400 to-sky-600'; 
      introPatternClass = 'intro-pattern-overlay isolate'; 
  } else if (weather) {
      // DASHBOARD MODE: Set background based on current weather data (dynamic)
      if (weatherDescription.includes('clear')) {
          outerBgClass = isDaytime 
            ? 'bg-gradient-to-br from-blue-400 to-sky-600'
            : 'bg-gradient-to-br from-gray-900 via-indigo-900 to-black'; 
      } else if (weatherDescription.includes('cloud') || weatherDescription.includes('overcast')) {
          outerBgClass = 'bg-gradient-to-br from-gray-500 to-slate-700'; 
      } else if (weatherDescription.includes('rain') || weatherDescription.includes('drizzle')) {
          outerBgClass = 'bg-gradient-to-br from-blue-800 via-gray-900 to-blue-950'; 
          backgroundEffectClass = 'rain-effect'; 
      } else if (weatherDescription.includes('thunderstorm') || weatherDescription.includes('storm')) {
          outerBgClass = 'bg-gradient-to-br from-black via-indigo-950 to-purple-950'; 
          backgroundEffectClass = 'rain-effect thunderstorm-effect'; 
      } else if (weatherDescription.includes('snow') || weatherDescription.includes('hail')) {
          outerBgClass = 'bg-gradient-to-br from-white to-blue-200'; 
      } else {
          outerBgClass = 'bg-gradient-to-br from-blue-200 to-indigo-300'; 
      }
  } else {
      // Dashboard is empty (no weather data yet)
      outerBgClass = 'bg-gray-200'; 
  }

  return (
    // 1. Outer Container (Full page background, including dynamic effect classes and the NEW introPatternClass)
    <div className={`${baseOuterClasses} ${outerBgClass} ${backgroundEffectClass} ${introPatternClass}`}>
        
        <Header clearHistoryAndResetApp={clearHistoryAndResetApp} isIntroMode={isIntroMode} />

        {/* --- Background Weather Icon --- */}
        {/* FIX: Render icons in Intro Mode using default 'cloudy' settings */}
        {(weather && !isIntroMode) ? (
             <BackgroundWeatherIcon 
                description={weather.description}
                isDay={weather.isDay}
             />
        ) : (isIntroMode && (
             <BackgroundWeatherIcon 
                description="cloudy" 
                isDay={1}            
             />
        ))}
        {/* ------------------------------------- */}

        {/* === MAIN CONTENT WRAPPER === */}
        <main className="flex-grow flex items-center justify-center p-4 relative z-10">
            
            {isIntroMode ? (
                // INTRO MODE
                <div className="flex flex-col items-center justify-center h-full w-full">
                    {/* PROMINENT TITLE BLOCK */}
                    <div className="text-center mb-10 mt-8 z-10">
                        <h1 className="text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
                            Instant Weather, <span className="text-indigo-900">Intelligently Cached</span>
                        </h1>
                    </div>
                    
                    {/* Intro View Content */}
                    <IntroView {...searchFormProps} />
                </div>
            ) : (
                // DASHBOARD MODE
                <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 z-10 py-8">
                    
                    {/* COLUMN 1 & 2: MAIN WEATHER CONTENT */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white/70 rounded-xl shadow-2xl p-6 md:p-8 border border-blue-200 border-opacity-70 backdrop-blur-sm">
                            
                            {/* DASHBOARD HEADER */}
                            <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-300">
                                <h2 className="text-2xl font-extrabold text-gray-800 flex items-center">
                                    Weather Dashboard
                                </h2>
                                
                                <button 
                                    onClick={clearCurrentView} // Clear current view button
                                    className="text-sm font-semibold text-gray-700 hover:text-blue-700 transition-colors px-3 py-1 rounded-md border border-gray-400 hover:border-blue-600 bg-white/50 flex items-center shadow-sm"
                                    aria-label="Clear current view"
                                >
                                    <RotateCcw className="w-4 h-4 mr-1"/> Clear View
                                </button>
                            </div>
                            
                            <div className="mb-6">
                                <SearchForm {...searchFormProps} />
                            </div>
                            
                            {/* Error Display */}
                            {error && !loading && (
                                <div className="p-4 bg-red-100/80 border border-red-400 text-red-700 rounded-lg mb-4 backdrop-blur-sm" role="alert">
                                    <strong className="font-bold">Error: </strong>
                                    <span className="block sm:inline">{error}</span>
                                </div>
                            )}
                            
                            {/* Weather Card and Reset Info */}
                            {weather && (
                                <>
                                    <CurrentWeatherCard 
                                        weather={weather} 
                                        loading={loading} 
                                    />
                                    
                                    <div className="mt-6 pt-4 border-t border-gray-300 p-3 bg-white/50 rounded-lg text-sm text-gray-700 backdrop-blur-sm shadow-inner">
                                        <p className="mb-2">
                                            To continue searching for a different city, use the search bar above or select a city from the Search History log on the right.
                                        </p>
                                        <p className="flex items-center">
                                            To fully clear your search history and return to the Home Page, 
                                            <button 
                                                onClick={clearHistoryAndResetApp} // Full reset button
                                                disabled={loading}
                                                className="text-red-600 font-bold hover:text-red-800 transition-colors ml-1 disabled:text-red-300 underline p-0 m-0 bg-transparent border-none cursor-pointer"
                                            >
                                                click here.
                                            </button>
                                        </p>
                                    </div>
                                </>
                            )}
                            
                            {/* Instructions Panel */}
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
                            fetchWeather={fetchWeather} 
                        />
                    </div>
                </div>
            )}
        </main>
        
        {/* === FOOTER (Pinned to the bottom) === */}
        <Footer />
    </div>
  );
};

export default WeatherPage;