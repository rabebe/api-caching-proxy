'use client';
import React from 'react';
import { Sun, Moon, Cloud, Droplet, Zap } from 'lucide-react';

interface BackgroundIconProps {
  description: string;
  isDay: number;
}

const BackgroundWeatherIcon: React.FC<BackgroundIconProps> = ({ description, isDay }) => {
  const lowerDesc = description.toLowerCase();
  let IconComponent: React.ElementType | null = null;
  let iconColor = 'text-white';
  let iconSize = 'w-20 h-20 md:w-32 md:h-32';

  if (lowerDesc.includes('clear')) {
    IconComponent = isDay === 1 ? Sun : Moon;
    iconColor = isDay === 1 ? 'text-yellow-300' : 'text-indigo-400';
  } else if (lowerDesc.includes('cloud') || lowerDesc.includes('overcast') || lowerDesc.includes('cloudy')) {
    IconComponent = Cloud;
    iconColor = 'text-gray-400';
  } else if (lowerDesc.includes('rain') || lowerDesc.includes('drizzle')) {
    IconComponent = Droplet;
    iconColor = 'text-blue-500';
  } else if (lowerDesc.includes('thunderstorm') || lowerDesc.includes('storm')) {
    IconComponent = Zap;
    iconColor = 'text-yellow-500';
    iconSize = 'w-16 h-16 md:w-24 md:h-24';
  } else if (lowerDesc.includes('snow') || lowerDesc.includes('hail')) {
    IconComponent = Cloud;
    iconColor = 'text-white';
  }

  if (!IconComponent) return null;

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
    <div className="absolute inset-0 z-0 pointer-events-none">
      {iconPositions.map((pos, index) => (
        <div
          key={index}
          className={`absolute transition-all duration-1000 ease-in-out ${pos.rotation} ${pos.delay}`}
          style={{ top: pos.top, left: pos.left }}
        >
          <IconComponent className={`${iconSize} ${iconColor} opacity-30 transition-all duration-1000`} />
        </div>
      ))}
    </div>
  );
};

export default React.memo(BackgroundWeatherIcon);
