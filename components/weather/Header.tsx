'use client';
import React from 'react';

const Header: React.FC = () => {
  const handleClick = () => {
    // Change the text (optional, can use state if you want dynamic change)
    // For a simple refresh, just reload the page
    window.location.reload();
  };

  return (
    <header
      className="fixed top-0 left-0 w-full z-20 bg-black/50 backdrop-blur-md text-white flex justify-between items-center p-4 cursor-pointer"
      onClick={handleClick}
    >
      <h1 className="text-xl font-bold">Caching Weather Client</h1>
    </header>
  );
};

export default Header;
