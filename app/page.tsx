'use client';

import React, { useState, useCallback, useMemo } from 'react';
import BackgroundWeatherIcon from '@/components/weather/BackgroundWeatherIcon';
import CurrentWeatherCard from '@/components/weather/CurrentWeatherCard';
import Footer from '@/components/weather/Footer';
import HistoryLog from '@/components/weather/HistoryLog';
import InstructionsPanel from '@/components/weather/InstructionsPanel';
import IntroView from '@/components/weather/IntroView';
import SearchForm from '@/components/weather/SearchForm';
import WeatherPageHeader from '@/components/weather/WeatherPageHeader';

const CLIENT_API_TOKEN = process.env.NEXT_PUBLIC_CLIENT_TOKEN;

export interface WeatherData {
  cityName: string;
  country: string;
  temperature: number;
  description: string;
  windKmh: number;
  lastUpdated: string;
  source: 'cache' | 'api';
  error?: string;

  apparentTemperature: number;
  windGusts: number;
  cloudCover: number;
  isDay: number;
  humidity: number;
  tempMax: number;
  tempMin: number;
}

const WeatherPage = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [searchedCities, setSearchedCities] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIntroMode = searchedCities.length === 0 && weather === null;

  // ---------------- CALLBACKS ----------------
  const fetchWeather = useCallback(async (searchCity: string) => {
    setLoading(true);
    setError(null);

    if (!searchCity.trim()) {
      setError('Please enter a valid city name.');
      setLoading(false);
      return;
    }

    if (!CLIENT_API_TOKEN) {
      setError('Client API token missing.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(searchCity)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch weather.');
      }

      setWeather(data);

      setSearchedCities(prev => {
        const filtered = prev.filter(c => c.cityName.toLowerCase() !== data.cityName.toLowerCase());
        return [data, ...filtered];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!city.trim()) {
        setError('Please enter a valid city name.');
        return;
      }
      fetchWeather(city.trim());
    },
    [city, fetchWeather]
  );

  const clearCurrentView = useCallback(() => {
    setWeather(null);
    setCity('');
    setError(null);
    setLoading(false);
  }, []);

  const goToIntroView = useCallback(() => {
    clearCurrentView();
    setSearchedCities([]);
  }, [clearCurrentView]);

  const searchFormProps = useMemo(
    () => ({ city, setCity, handleSubmit, loading, error }),
    [city, handleSubmit, loading, error]
  );

  // ---------------- BACKGROUND CLASSES ----------------
  const baseOuterClasses = 'min-h-screen flex flex-col font-sans transition-all duration-1000 relative overflow-hidden';
  let outerBgClass = '';
  let backgroundEffectClass = '';
  let introPatternClass = '';

  if (isIntroMode) {
    outerBgClass = 'bg-gradient-to-br from-blue-400 to-sky-600';
    introPatternClass = 'intro-pattern-overlay isolate';
  } else if (weather) {
    const desc = weather.description.toLowerCase();
    const isDaytime = weather.isDay === 1;

    if (desc.includes('clear')) {
      outerBgClass = isDaytime
        ? 'bg-gradient-to-br from-blue-400 to-sky-600'
        : 'bg-gradient-to-br from-gray-900 via-indigo-900 to-black';
    } else if (desc.includes('cloud')) {
      outerBgClass = 'bg-gradient-to-br from-gray-500 to-slate-700';
    } else if (desc.includes('rain')) {
      outerBgClass = 'bg-gradient-to-br from-blue-800 via-gray-900 to-blue-950';
      backgroundEffectClass = 'rain-effect';
    } else if (desc.includes('storm')) {
      outerBgClass = 'bg-gradient-to-br from-black via-indigo-950 to-purple-950';
      backgroundEffectClass = 'rain-effect thunderstorm-effect';
    } else if (desc.includes('snow')) {
      outerBgClass = 'bg-gradient-to-br from-white to-blue-200';
    } else {
      outerBgClass = 'bg-gradient-to-br from-blue-200 to-indigo-300';
    }
  }

  return (
    <div className={`${baseOuterClasses} ${outerBgClass} ${backgroundEffectClass} ${introPatternClass}`}>
      {/* WeatherPageHeader handles "Back to Intro" button */}
      <WeatherPageHeader goToIntroView={goToIntroView} isIntroMode={isIntroMode} />

      {/* Background icon */}
      <BackgroundWeatherIcon description={weather?.description || 'cloudy'} isDay={weather?.isDay ?? 1} />

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        {isIntroMode ? (
          <IntroView {...searchFormProps} />
        ) : (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
            <div className="md:col-span-2 space-y-6">
              <SearchForm {...searchFormProps} />

              {error && !loading && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {weather && (
                <>
                  <CurrentWeatherCard
                    city={weather.cityName}
                    country={weather.country}
                    temperature={weather.temperature}
                    condition={weather.description}
                    feelsLike={weather.apparentTemperature}
                    tempMax={weather.tempMax}
                    tempMin={weather.tempMin}
                    windSpeed={weather.windKmh}
                    windGust={weather.windGusts}
                    clouds={weather.cloudCover}
                    humidity={weather.humidity}
                    lastUpdated={weather.lastUpdated}
                    isCacheHit={weather.source === 'cache'}
                    isDay={weather.isDay}
                    loading={loading}
                  />

                  <button
                    onClick={clearCurrentView}
                    className="text-sm underline text-blue-200 hover:text-white"
                  >
                    Clear current city and return to Intro
                  </button>
                </>
              )}

              {!weather && searchedCities.length > 0 && <InstructionsPanel />}
            </div>

            <HistoryLog
              searchedCities={searchedCities}
              weather={weather}
              fetchWeather={fetchWeather}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default WeatherPage;