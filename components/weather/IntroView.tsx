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
  <div className="flex flex-col items-center justify-center w-full text-center p-4 text-white z-10 relative">
    <div className="relative p-6 rounded-full bg-yellow-100/70 mb-8 border-4 border-yellow-300 transform transition-transform duration-500 hover:scale-105 shadow-xl backdrop-blur-sm">
      <Image src="/favicon.ico" alt="Caching Weather App Logo" width={64} height={64} className="w-16 h-16 object-contain"/>
    </div>
    <p className="text-white text-opacity-90 mb-8 max-w-sm text-lg drop-shadow-md">
      Enter a city name to get the current weather. Subsequent searches for the same city within 5 minutes will be served from the Firestore Cache.
    </p>
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
export default IntroView;
