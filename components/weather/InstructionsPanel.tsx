'use client';
import React from 'react';
import { Sun } from 'lucide-react';

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
export default InstructionsPanel;
