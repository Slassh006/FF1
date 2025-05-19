'use client';

import React, { useState } from 'react';
import { FaEdit, FaEye, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import Link from 'next/link';

// Mock data for development
const MOCK_PAGES = [
  { 
    id: '1', 
    title: 'Home Page', 
    slug: '/', 
    lastUpdated: '2024-04-01T10:30:00Z',
    sections: 4
  },
  { 
    id: '2', 
    title: 'About Us', 
    slug: '/about-us', 
    lastUpdated: '2024-03-25T14:15:00Z',
    sections: 3
  },
  { 
    id: '3', 
    title: 'Privacy Policy', 
    slug: '/privacy-policy', 
    lastUpdated: '2024-02-10T09:45:00Z',
    sections: 5
  },
  { 
    id: '4', 
    title: 'Terms of Service', 
    slug: '/terms-of-service', 
    lastUpdated: '2024-02-10T11:20:00Z',
    sections: 6
  },
  { 
    id: '5', 
    title: 'Disclaimer', 
    slug: '/disclaimer', 
    lastUpdated: '2024-04-05T16:30:00Z',
    sections: 4
  },
  { 
    id: '6', 
    title: 'Contact Us', 
    slug: '/contact', 
    lastUpdated: '2024-03-15T13:10:00Z',
    sections: 2
  },
];

const AdminPagesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter pages based on search
  const filteredPages = MOCK_PAGES.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white font-orbitron">Manage Pages</h1>
        <Link 
          href="/admin/pages/new" 
          className="bg-primary hover:bg-primary/80 text-dark font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
        >
          <FaPlus className="mr-2" /> Create New Page
        </Link>
      </div>
      
      {/* Search */}
      <div className="bg-secondary p-4 rounded-lg mb-6 border border-primary/20">
        <div className="relative">
          <input
            type="text"
            placeholder="Search pages..."
            className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white focus:border-primary focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            width="16" 
            height="16" 
            fill="currentColor" 
            viewBox="0 0 16 16"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
        </div>
      </div>
      
      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map(page => (
          <div 
            key={page.id}
            className="bg-secondary rounded-lg border border-primary/20 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="p-5">
              <h3 className="text-white text-lg font-medium mb-2">{page.title}</h3>
              <p className="text-white/60 text-sm mb-4 truncate">
                {page.slug}
              </p>
              
              <div className="flex items-center text-white/50 text-xs mb-6">
                <FaCalendarAlt className="mr-2" />
                Last updated: {new Date(page.lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              
              <div className="flex justify-between">
                <span className="bg-dark text-white/70 text-xs px-3 py-1 rounded-full">
                  {page.sections} sections
                </span>
                
                <div className="flex space-x-2">
                  <Link
                    href={`/admin/pages/edit/${page.id}`}
                    className="text-white hover:text-primary transition-colors"
                    title="Edit Page"
                  >
                    <FaEdit size={18} />
                  </Link>
                  <Link
                    href={page.slug}
                    target="_blank"
                    className="text-white hover:text-primary transition-colors"
                    title="View Page"
                  >
                    <FaEye size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredPages.length === 0 && (
        <div className="bg-secondary rounded-lg border border-primary/20 p-8 text-center">
          <p className="text-white/70 mb-4">No pages found matching your search.</p>
          <Link 
            href="/admin/pages/new" 
            className="bg-primary hover:bg-primary/80 text-dark font-medium py-2 px-4 rounded-lg inline-flex items-center transition-colors"
          >
            <FaPlus className="mr-2" /> Create New Page
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminPagesPage; 