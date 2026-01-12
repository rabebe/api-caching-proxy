'use client';
import React from 'react';
import Image from 'next/image';
import SearchForm from './SearchForm';

interface IntroViewProps {
  city: string;
  setCity: (city: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}

const IntroView: React.FC<IntroViewProps> = React.memo(({ error, ...props }) => (
  <div className="flex flex-col items-center justify-center h-full w-full text-center p-4 text-white z-10 relative">
    
    {/* Logo */}
    <div className="relative p-6 rounded-full mb-8 transform transition-transform duration-500 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
      <Image 
        src="/favicon.ico" 
        alt="Caching Weather Client Logo" 
        width={64} 
        height={64} 
        className="w-16 h-16 object-contain"
      />
    </div>

    {/* Landing Page Title */}
    <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]">
      Caching Weather Client
    </h1>

    {/* Info / Subtitle */}
    <p className="text-white text-opacity-90 mb-8 max-w-sm text-lg drop-shadow-[0_0_6px_rgba(0,0,0,0.4)]">
      Enter a city name to get the current weather. Subsequent searches for the same city within 5 minutes will be served from the Firestore Cache.
    </p>

    {/* Error display */}
    {error && (
      <div className="p-4 mb-4 bg-red-100/80 border border-red-400 text-red-700 rounded-lg w-full max-w-sm backdrop-blur-sm" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    )}

    {/* Search Form */}
    <div className="w-full max-w-sm">
      <SearchForm {...props} isIntroMode={true} />
    </div>
  </div>
));

IntroView.displayName = 'IntroView';
export default IntroView;
