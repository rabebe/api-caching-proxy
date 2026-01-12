'use client';
import React from 'react';
import { List } from 'lucide-react';

interface WeatherData {
  cityName: string;
  temperature: number;
  lastUpdated: string;
  source: 'cache' | 'api';
}

interface HistoryLogProps {
  searchedCities: WeatherData[];
  weather: WeatherData | null;
  fetchWeather: (city: string) => Promise<void>;
}

const formattedLastUpdated = (lastUpdated: string) => new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

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
              <p>{data.source === 'cache' ? 'CACHED' : 'LIVE'}</p>
              <p>{formattedLastUpdated(data.lastUpdated)}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
));

HistoryLog.displayName = 'HistoryLog';
export default HistoryLog;
