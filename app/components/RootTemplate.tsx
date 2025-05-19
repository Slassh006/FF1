'use client';

import React from 'react';
import Navbar from './Navbar';

interface RootTemplateProps {
  children: React.ReactNode;
}

const RootTemplate: React.FC<RootTemplateProps> = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen">{children}</main>
    </>
  );
};

export default RootTemplate; 