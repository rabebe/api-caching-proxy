'use client';
import React from 'react';
import { Search, Loader } from 'lucide-react';

interface SearchFormProps {
  city: string;
  setCity: (city: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  isIntroMode?: boolean;
}

const SearchForm: React.FC<SearchFormProps> = React.memo(({ city, setCity, handleSubmit, loading, isIntroMode }) => (
  <form onSubmit={handleSubmit} className="flex space-x-2 w-full max-w-sm mx-auto">
    <input
      type="text"
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="Enter city (e.g., London, Tokyo)"
      className={`flex-grow p-3 rounded-full focus:ring-blue-500 focus:border-blue-500 transition duration-150 shadow-lg text-lg text-gray-900 
                  ${isIntroMode ? 'bg-white/80 border-2 border-white backdrop-blur-sm' : 'bg-white border border-gray-300'}`} 
      disabled={loading}
      autoComplete="off"
    />
    <button
      type="submit"
      className={`p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-150 flex items-center justify-center shadow-lg disabled:bg-blue-400
                  ${isIntroMode ? 'border-2 border-blue-700' : ''}`}
      disabled={loading}
      aria-label="Search Weather"
    >
      {loading ? <Loader className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
    </button>
  </form>
));

SearchForm.displayName = 'SearchForm';
export default SearchForm;
