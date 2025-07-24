'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  initialValue?: string;
}

export default function SearchBar({ 
  placeholder = "Search for products, categories, or sellers...", 
  className = "",
  onSearch,
  initialValue = ""
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const router = useRouter();

  useEffect(() => {
    setSearchQuery(initialValue);
  }, [initialValue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  return (
    <form onSubmit={handleSearch} className={`relative flex w-full ${className}`}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-12 pr-32 text-gray-900 bg-white border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
      />
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-400" />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-md hover:from-primary-700 hover:to-secondary-700 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        Search
      </button>
    </form>
  );
}