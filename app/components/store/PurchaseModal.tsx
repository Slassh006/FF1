'use client';

import { useSession } from 'next-auth/react';
import { FaCoins, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import { StoreItem } from '@/app/types/store';

interface PurchaseModalProps {
  item: StoreItem;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function PurchaseModal({ item, onConfirm, onClose, isLoading = false }: PurchaseModalProps) {
  const { data: session } = useSession();
  const userCoins = (session?.user as any)?.coins || 0;
  const canAfford = userCoins >= item.price;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Confirm Purchase</h2>
        
        <div className="flex items-start space-x-4 mb-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-gray-400 text-sm mb-2">{item.description}</p>
            <div className="flex items-center space-x-1">
              <FaCoins className="text-yellow-400" />
              <span className="font-bold">{item.price}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-300">Your Balance</span>
            <div className="flex items-center space-x-1">
              <FaCoins className="text-yellow-400" />
              <span>{userCoins}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">Remaining After Purchase</span>
            <div className="flex items-center space-x-1">
              <FaCoins className="text-yellow-400" />
              <span className={!canAfford ? 'text-red-500' : ''}>
                {userCoins - item.price}
              </span>
            </div>
          </div>
        </div>

        {!canAfford && (
          <p className="text-red-500 text-sm mb-4">
            You don't have enough coins to purchase this item
          </p>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            disabled={!canAfford || isLoading}
            className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2
              ${canAfford && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 cursor-not-allowed text-gray-300'
              }`}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Confirm Purchase</span>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 