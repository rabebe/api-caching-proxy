'use client';
import React from 'react';

interface WeatherPageHeaderProps {
  goToIntroView: () => void;
  isIntroMode: boolean;
}

const WeatherPageHeader: React.FC<WeatherPageHeaderProps> = ({ goToIntroView, isIntroMode }) => {
  const handleClick = () => {
    window.location.reload(); // refreshes the page
  };

  return (
    <header
      className="fixed top-0 left-0 w-full z-20 bg-black/50 backdrop-blur-md text-white flex justify-between items-center p-4 cursor-pointer"
      onClick={handleClick}
    >
      <h1 className="text-xl font-bold">Caching Weather Client</h1>

      {/* Show button only when NOT in intro view */}
      {!isIntroMode && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent header click from triggering page reload
            goToIntroView();
          }}
          className="text-sm underline hover:text-yellow-300"
        >
          Back to Intro
        </button>
      )}
    </header>
  );
};

export default WeatherPageHeader;
