'use client';

import React from 'react';
import { getWeatherIcon } from './weatherHelpers';

export interface CurrentWeatherCardProps {
  city: string;
  country: string;
  temperature: number;
  condition: string;
  feelsLike: number;
  tempMax: number;
  tempMin: number;
  windSpeed: number;
  windGust: number;
  clouds: number;
  humidity: number;
  lastUpdated: string;
  isCacheHit: boolean;
  isDay: number;
  loading: boolean;
}

const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  city,
  country,
  temperature,
  condition,
  feelsLike,
  tempMax,
  tempMin,
  windSpeed,
  windGust,
  clouds,
  humidity,
  lastUpdated,
  isCacheHit,
  isDay,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-6 bg-white/70 rounded-xl shadow-md animate-pulse">
        Loading weather...
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/70 rounded-xl shadow-2xl border border-blue-200 border-opacity-70 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          {city}, {country}
        </h3>
        {isCacheHit && (
          <span className="text-sm text-gray-600">Cache Hit</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-5xl font-bold text-gray-800">{Math.round(temperature)}°C</div>
        <div className="text-3xl">{getWeatherIcon(condition, isDay ? 1 : 0)}</div>
      </div>

      <div className="text-gray-700 mb-2">Condition: {condition}</div>
      <div className="text-gray-700 mb-2">
        Feels Like: {feelsLike}°C (Max: {tempMax}°C / Min: {tempMin}°C)
      </div>
      <div className="text-gray-700 mb-2">
        Wind: {windSpeed} km/h (Gusts: {windGust} km/h)
      </div>
      <div className="text-gray-700 mb-2">Clouds: {clouds}%</div>
      <div className="text-gray-700 mb-2">Humidity: {humidity}%</div>
      <div className="text-gray-500 text-sm">Updated: {lastUpdated}</div>
    </div>
  );
};

export default CurrentWeatherCard;
