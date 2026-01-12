'use client';
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-20 bg-black/50 backdrop-blur-md text-white flex justify-between items-center p-4">
      <h1 className="text-xl font-bold">Weather App</h1>
    </header>
  );
};

export default Header;
