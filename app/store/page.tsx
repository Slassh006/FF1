'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { StoreItem } from '@/app/types/store';
import StoreItemComponent from '@/app/components/store/StoreItem';
import { toast } from 'react-hot-toast';
import { FaShoppingCart, FaSpinner } from 'react-icons/fa';

export default function StorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreItems();
  }, []);

  const fetchStoreItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/store');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch store items');
      }
      const data: StoreItem[] = await response.json();
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching store items:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load store items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item: StoreItem) => {
    const currentInventory = item.inventory ?? null;
    const isOutOfStock = currentInventory !== null && currentInventory <= 0;
    if (!item.isActive || isOutOfStock) {
      toast.error('This item is currently unavailable.');
      return;
    }

    if (status === 'loading') {
      return;
    }

    if (status !== 'authenticated') {
      toast.error('Please log in to add items to your cart.');
      return;
    }

    setAddingToCart(item._id);
    
    try {
      const response = await fetch('/api/profile/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: item._id, quantity: 1 }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add item to cart');
      }

      toast.success(`${item.name} added to cart!`);
      
      console.log('Cart update Response:', result);

    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error instanceof Error ? error.message : 'Could not add item to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-blue-500 text-4xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Store</h1>
      
      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-gray-800 rounded-lg">
          <FaShoppingCart className="mx-auto text-6xl text-gray-600 mb-4" />
          <p className="text-xl">The store is currently empty.</p>
          <p className="text-gray-500">Check back later for new items!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.map((item, index) => (
            <StoreItemComponent
              key={item._id}
              item={item}
              index={index}
              onAddToCart={handleAddToCart}
              isAddingToCart={addingToCart === item._id}
            />
          ))}
        </div>
      )}
    </div>
  );
} 