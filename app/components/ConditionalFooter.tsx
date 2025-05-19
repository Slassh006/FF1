'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Footer from './Footer'; // Adjust path if Footer is located elsewhere

const ConditionalFooter = () => {
  const pathname = usePathname();

  // Define paths where the footer should be hidden
  const hiddenPaths = ['/cart', '/profile'];
  // Check if the path starts with /admin
  const isAdminPath = pathname?.startsWith('/admin');

  // Determine if the footer should be shown
  const showFooter = !hiddenPaths.includes(pathname || '') && !isAdminPath;

  // Render Footer only if showFooter is true
  return showFooter ? <Footer /> : null;
};

export default ConditionalFooter; 