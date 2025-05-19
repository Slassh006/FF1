'use client';

import React from 'react';
import Link from 'next/link';

export default function NavbarLogo() {
  return (
    <div className="flex items-center">
      <Link href="/" className="flex items-center space-x-2">
        <span className="text-2xl font-bold text-white hover:text-indigo-400 transition-colors">
          TheFreeFireIndia
        </span>
      </Link>
    </div>
  );
} 