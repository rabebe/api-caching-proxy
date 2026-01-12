'use client';
import { Sun, Moon, Cloud, Droplet, Zap } from 'lucide-react';

/**
 * Formats a timestamp string into human-readable time (hh:mm AM/PM)
 */
export const formattedLastUpdated = (lastUpdated: string) => {
  return new Date(lastUpdated).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Returns a weather icon component based on the weather description and time of day
 */
export const getWeatherIcon = (description: string, isDay: number) => {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('clear')) {
    return isDay === 1
      ? <Sun className="w-16 h-16 text-yellow-400 drop-shadow-lg" />
      : <Moon className="w-16 h-16 text-indigo-300 drop-shadow-lg" />;
  }
  if (lowerDesc.includes('rain') || lowerDesc.includes('drizzle')) {
    return <Droplet className="w-16 h-16 text-blue-400 drop-shadow-lg" />;
  }
  if (lowerDesc.includes('snow') || lowerDesc.includes('hail')) {
    return <Cloud className="w-16 h-16 text-gray-300 drop-shadow-lg" />;
  }
  if (lowerDesc.includes('thunderstorm') || lowerDesc.includes('storm')) {
    return <Zap className="w-16 h-16 text-yellow-500 drop-shadow-lg" />;
  }
  if (lowerDesc.includes('cloud') || lowerDesc.includes('overcast')) {
    return <Cloud className="w-16 h-16 text-gray-400 drop-shadow-lg" />;
  }

  // Default icon
  return <Cloud className="w-16 h-16 text-gray-400 drop-shadow-lg" />;
};
