'use client';
import React from 'react';

const Footer: React.FC = React.memo(() => (
  <footer className="w-full bg-gray-900 text-white mt-auto py-4">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
      &copy; {new Date().getFullYear()} Caching Weather Client. All rights reserved.
      <p className="mt-1">
        Data provided by 
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors underline mx-1">Open-Meteo</a>
        | Powered by
        <a href="https://firebase.google.com/docs/firestore" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors underline mx-1">Firestore</a>
      </p>
    </div>
  </footer>
));

Footer.displayName = 'Footer';
export default Footer;
