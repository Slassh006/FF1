'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaStore, FaBox, FaCoins } from 'react-icons/fa';
import StoreContainer from './StoreContainer';
import UserInventory from './UserInventory';

export default function StoreLayout() {
  const { data: session } = useSession();
  const [view, setView] = useState<'store' | 'inventory'>('store');
  const userCoins = (session?.user as any)?.coins || 0;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Store</h1>
          {session?.user && (
            <div className="flex items-center bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700/50">
              <FaCoins className="text-yellow-400 mr-2" />
              <span className="font-bold">{userCoins}</span>
              <span className="text-gray-400 ml-1">coins</span>
            </div>
          )}
        </div>

        {session?.user && (
          <div className="flex space-x-4">
            <button
              onClick={() => setView('store')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                view === 'store'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FaStore className="mr-2" />
              Store
            </button>
            <button
              onClick={() => setView('inventory')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                view === 'inventory'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FaBox className="mr-2" />
              My Items
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {view === 'store' ? (
          <StoreContainer />
        ) : (
          <UserInventory />
        )}
      </div>
    </div>
  );
} 