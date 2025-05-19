'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

export default function SearchButtonAndModal() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref for focus

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page
      // Consider using Next.js router if available via props or context
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setSearchOpen(true)}
        className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none"
        aria-label="Search"
      >
        <FaSearch />
      </button>

      {/* Search Modal/Overlay */}
      {searchOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 pt-16" 
          onClick={(e) => { 
            // Close only if clicking overlay itself
            if (e.target === e.currentTarget) {
              setSearchOpen(false);
              setSearchQuery('');
            }
          }}
        >
          <div 
            className="bg-gray-800 p-4 rounded-lg shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
              aria-label="Close search"
            >
              <FaTimes />
            </button>
            <form onSubmit={handleSearchSubmit}>
              <label htmlFor="search-input" className="sr-only">Search</label>
              <input
                ref={searchInputRef}
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search the site..."
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {/* Optional: Add a submit button if needed, or rely on Enter key */}
              {/* <button type="submit" className="...">Search</button> */}
            </form>
          </div>
        </div>
      )}
    </>
  );
} 