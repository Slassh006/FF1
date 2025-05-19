'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaCoins, FaShoppingCart, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { StoreItem } from '@/app/types/store';

interface StoreItemProps {
  item: StoreItem;
  index: number;
  onAddToCart: (item: StoreItem) => void;
  isAddingToCart: boolean;
}

// Define hover color classes
const hoverClasses = [
  { shadow: 'hover:shadow-cyan-500/30', border: 'hover:border-cyan-700' },
  { shadow: 'hover:shadow-red-500/30', border: 'hover:border-red-700' },
  { shadow: 'hover:shadow-green-500/30', border: 'hover:border-green-700' },
  { shadow: 'hover:shadow-yellow-500/30', border: 'hover:border-yellow-700' },
  { shadow: 'hover:shadow-purple-500/30', border: 'hover:border-purple-700' },
  { shadow: 'hover:shadow-pink-500/30', border: 'hover:border-pink-700' },
];

export default function StoreItemComponent({ item, index, onAddToCart, isAddingToCart }: StoreItemProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const isAvailable = item.isActive && (item.inventory === null || (item.inventory ?? 0) > 0);
  const currentInventory = item.inventory ?? null;

  // Select hover class based on index
  const selectedHover = hoverClasses[index % hoverClasses.length];

  return (
    <div 
      className={`relative bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 transition-shadow duration-300 ${isAvailable ? `${selectedHover.shadow} ${selectedHover.border}` : 'opacity-60'}`}
      role="article"
      aria-labelledby={`item-title-${item._id}`}
    >
      <div className="relative h-48 w-full bg-gray-700">
        {!imageError && item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            unoptimized={item.imageUrl.startsWith('http')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <FaInfoCircle className="mr-2" />
            <span>Image Unavailable</span>
          </div>
        )}
        <span className="absolute top-2 left-2 bg-cyan-600 text-white text-xs font-semibold px-2 py-1 rounded">
            {item.category}
        </span>
      </div>
      
      <div className="p-4">
        <h3 
          id={`item-title-${item._id}`}
          className="text-lg font-semibold text-white mb-2 truncate"
          title={item.name}
        >
          {item.name}
        </h3>
        
        <p className="text-gray-400 text-sm mb-4 h-10 line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-1 text-yellow-400">
            <FaCoins />
            <span className="font-bold text-lg">{item.coinCost}</span>
          </div>
          
          <button
            onClick={() => onAddToCart(item)}
            disabled={isAddingToCart || !isAvailable}
            className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 min-w-[100px] ${ 
              !isAvailable
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : isAddingToCart
                ? 'bg-blue-700 text-white cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            aria-label={`Add ${item.name} to cart for ${item.coinCost} coins`}
          >
            {isAddingToCart ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaShoppingCart className="mr-2" />
            )}
            <span>{isAddingToCart ? 'Adding...' : (isAvailable ? 'Add Cart' : 'Unavailable')}</span>
          </button>
        </div>
        
        {currentInventory !== null && currentInventory <= 10 && isAvailable && (
            <p className="text-xs text-red-400 mt-2 text-right">Only {currentInventory} left!</p>
        )}
      </div>

      {!isAvailable && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white font-semibold bg-red-600 px-3 py-1 rounded">Unavailable</span>
        </div>
      )}
    </div>
  );
} 