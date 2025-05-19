'use client';

import React from 'react';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';

interface NavItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  isActive: (path: string) => boolean;
  // Potentially add session/status props if auth links are needed here
}

export default function MobileNavMenu({ 
  isOpen, 
  onClose, 
  navItems, 
  isActive 
}: MobileNavMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        aria-hidden="true"
        onClick={onClose}
      ></div>

      {/* Sidebar - Use theme colors */}
      <div className="fixed top-0 right-0 h-full w-64 bg-secondary shadow-xl p-4 z-60 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-primary/10 p-1 rounded">
            <FaTimes className="h-6 w-6" />
          </button>
        </div>
        
        {/* Navigation Links - Use theme colors */}
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose} // Close menu on navigation
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive(item.path)
                  ? 'text-black bg-primary'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon} 
              {item.name}
            </Link>
          ))}
          {/* TODO: Add Login/Register or Profile/Admin links here using theme buttons/styles */}
        </nav>
      </div>
    </div>
  );
} 