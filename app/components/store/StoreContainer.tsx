'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import StoreItem from './StoreItem';
import StoreFilters from './StoreFilters';
import PurchaseModal from './PurchaseModal';
import { toast } from 'react-hot-toast';
import { FaSpinner, FaBox, FaExclamationCircle } from 'react-icons/fa';
import { StoreItem as IStoreItem, StoreItemType, ApiResponse } from '@/app/types/store';

export default function StoreContainer() {
  const { data: session } = useSession();
  const [items, setItems] = useState<IStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<StoreItemType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<IStoreItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/store/items');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch store items');
      }
      
      setItems(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching items');
      toast.error('Failed to load store items');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: IStoreItem) => {
    try {
      setPurchasingItemId(item._id);
      
      const response = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: item._id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Purchase failed');
      }
      
      toast.success('Purchase successful!');
      fetchItems(); // Refresh items to update inventory
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasingItemId(null);
    }
  };

  const handlePurchaseClick = (item: IStoreItem) => {
    if (!session) {
      toast.error('Please login to make purchases', {
        icon: '🔒',
        duration: 3000,
      });
      return;
    }
    setSelectedItem(item);
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedItem || !session) return;

    try {
      setPurchaseLoading(true);
      const response = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: selectedItem._id }),
      });

      const data: ApiResponse<{ success: boolean }> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Purchase failed');
      }

      toast.success('Purchase successful!');
      setShowPurchaseModal(false);
      fetchItems(); // Refresh the store items
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    typeFilter === 'all' || item.type === typeFilter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <FaSpinner className="animate-spin text-2xl text-blue-600" />
          <span className="text-lg">Loading store items...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchItems}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No items available in the store.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="sticky top-16 z-10 bg-gradient-to-b from-gray-900 via-gray-900/95 to-transparent backdrop-blur-sm py-4">
        <StoreFilters
          selectedType={typeFilter}
          onTypeChange={setTypeFilter}
          itemTypes={Array.from(new Set(items.map(item => item.type)))}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <StoreItem
            key={item._id}
            item={item}
            onPurchase={handlePurchase}
            isPurchasing={purchasingItemId === item._id}
          />
        ))}
      </div>

      {showPurchaseModal && selectedItem && (
        <PurchaseModal
          item={selectedItem}
          onConfirm={handlePurchaseConfirm}
          onClose={() => setShowPurchaseModal(false)}
          isLoading={purchaseLoading}
        />
      )}
    </div>
  );
} 