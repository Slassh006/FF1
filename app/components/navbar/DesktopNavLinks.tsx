'use client';

import React from 'react';
import Link from 'next/link';

interface NavItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface DesktopNavLinksProps {
  navItems: NavItem[];
  isActive: (path: string) => boolean;
}

export default function DesktopNavLinks({ navItems, isActive }: DesktopNavLinksProps) {
  return (
    <div className="hidden md:flex md:items-center md:space-x-1">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative nav-link ${ 
            isActive(item.path)
              ? 'text-primary after:w-full'
              : 'text-white'
          }`}
        >
          <span className="flex items-center">
            {/* Optional: Render icon if needed */}
            {/* {item.icon} */}
            {item.name}
          </span>
        </Link>
      ))}
    </div>
  );
} 