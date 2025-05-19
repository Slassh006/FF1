'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaEyeSlash,
  FaSearch,
  FaFilter,
  FaDownload,
  FaCoins,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import AddEditItemModal from './AddEditItemModal';
import OrdersManager from './OrdersManager';
import { useSession } from 'next-auth/react';
import { StoreItem, StoreItemCategory, Order } from '@/app/types/store';

export default function AdminStoreManager() {
  const { data: session } = useSession();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'orders'>('items');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | StoreItemCategory>('all');

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchStoreData();
    }
  }, [session]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const [itemsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/store'),
        fetch('/api/admin/store/orders')
      ]);

      if (!itemsRes.ok) {
        const errorData = await itemsRes.json();
        throw new Error(errorData.error || 'Failed to fetch store items');
      }

      const itemsData: StoreItem[] = await itemsRes.json();
      setItems(itemsData);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData as any[]);
      } else {
        console.warn('Failed to fetch orders. Ensure /api/admin/store/orders exists.');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setShowAddModal(true);
  };

  const handleEditItem = (item: StoreItem) => {
    setSelectedItem(item);
    setShowAddModal(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/admin/store/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete item');
      }

      toast.success('Item deleted successfully');
      setItems(prevItems => prevItems.filter(item => item._id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete item');
    }
  };

  const handleToggleActive = async (item: StoreItem) => {
    const itemId = item._id;
    const currentIsActive = item.isActive;
    const optimisticNewIsActive = !currentIsActive;

    setItems(prevItems =>
        prevItems.map(i =>
            i._id === itemId ? { ...i, isActive: optimisticNewIsActive } : i
        )
    );

    try {
      const response = await fetch(`/api/admin/store/${itemId}/toggle-active`, {
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update status');
      }

      const updatedItem: StoreItem = await response.json();

       setItems(prevItems =>
        prevItems.map(i => (i._id === itemId ? updatedItem : i))
       );

      toast.success('Item status updated successfully');
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
      setItems(prevItems =>
        prevItems.map(i =>
            i._id === itemId ? { ...i, isActive: currentIsActive } : i
        )
    );
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <FaSpinner className="animate-spin text-primary text-4xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-secondary p-6 rounded-lg shadow-lg">
      <div className="flex space-x-4 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-t-lg transition-colors duration-200 ${activeTab === 'items' ? 'bg-primary text-black' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
        >
          Store Items
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-t-lg transition-colors duration-200 ${activeTab === 'orders' ? 'bg-primary text-black' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
        >
          Orders
        </button>
      </div>

      {activeTab === 'items' ? (
        <>
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-600 bg-dark text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <select
                  className="appearance-none w-full md:w-auto bg-dark border border-gray-600 text-white px-4 py-2 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-gray-700 focus:border-primary focus:ring-1 focus:ring-primary"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as 'all' | StoreItemCategory)}
                >
                  <option value="all">All Categories</option>
                  {Object.values(StoreItemCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <button
                onClick={handleAddItem}
                className="flex items-center px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/80 transition-colors duration-200 whitespace-nowrap"
              >
                <FaPlus className="mr-2" />
                Add New Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full bg-dark text-gray-300">
              <thead className="bg-black/20 text-gray-200 uppercase text-sm leading-normal">
                <tr>
                  <th className="py-3 px-6 text-left">Image</th>
                  <th className="py-3 px-6 text-left">Name</th>
                  <th className="py-3 px-6 text-left">Category</th>
                  <th className="py-3 px-6 text-left">Cost</th>
                  <th className="py-3 px-6 text-center">Inventory</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-200 text-sm font-light">
                {filteredItems.length > 0 ? filteredItems.map((item) => (
                  <tr key={item._id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <img
                        src={item.imageUrl || '/placeholder-image.png'}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded border border-gray-600"
                        onError={(e) => (e.currentTarget.src = '/placeholder-image.png')}
                      />
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </td>
                    <td className="py-3 px-6 text-left">{item.category}</td>
                    <td className="py-3 px-6 text-left flex items-center">
                      <FaCoins className="text-primary mr-1"/> {item.coinCost}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {item.inventory === null ? '∞' : item.inventory}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center gap-3">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-400 hover:text-blue-300 transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`${item.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'} transition`}
                          title={item.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {item.isActive ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-red-500 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-6 px-6 text-center text-gray-400">
                      No store items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showAddModal && (
            <AddEditItemModal
              item={selectedItem}
              onClose={() => setShowAddModal(false)}
              onSave={() => {
                setShowAddModal(false);
                fetchStoreData();
              }}
            />
          )}
        </>
      ) : (
        <OrdersManager orders={orders} onOrderUpdate={fetchStoreData} />
      )}
    </div>
  );
} 