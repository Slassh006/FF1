'use client';

import { Toaster } from 'react-hot-toast';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 