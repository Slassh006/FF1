'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { FaCoins, FaSpinner, FaBox, FaHistory, FaCopy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { StoreItem, Order } from '@/app/types/store';

interface InventoryItem extends StoreItem {
  purchaseDate: string;
  orderId: string;
  metadata?: {
    redeemCode?: string;
    voucherInfo?: {
      provider: string;
      code: string;
      instructions: string;
    };
  };
}

export default function UserInventory() {
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'items' | 'history'>('items');

  useEffect(() => {
    if (session?.user) {
      fetchUserInventory();
    }
  }, [session]);

  const fetchUserInventory = async () => {
    try {
      setLoading(true);
      const [itemsRes, ordersRes] = await Promise.all([
        fetch('/api/user/inventory'),
        fetch('/api/user/orders')
      ]);

      if (!itemsRes.ok || !ordersRes.ok) {
        throw new Error('Failed to fetch inventory data');
      }

      const [itemsData, ordersData] = await Promise.all([
        itemsRes.json(),
        ordersRes.json()
      ]);

      setItems(itemsData);
      setOrders(ordersData);
    } catch (error) {
      toast.error('Failed to load inventory');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
        <p className="text-gray-400">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex space-x-4 bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg sticky top-16 z-10">
        <button
          onClick={() => setView('items')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            view === 'items'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <FaBox className="mr-2" />
          Inventory
        </button>
        <button
          onClick={() => setView('history')}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            view === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <FaHistory className="mr-2" />
          Purchase History
        </button>
      </div>

      {view === 'items' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <FaBox className="text-5xl text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Items Yet</h3>
              <p className="text-gray-400">Visit the store to purchase items!</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item._id}-${item.orderId}`} className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50">
                <div className="relative h-48">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 right-2 bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-gray-700/50">
                    {item.type}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                    <p className="text-gray-400 text-sm">{item.description}</p>
                  </div>

                  {item.metadata?.redeemCode && (
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Redeem Code:</span>
                        <button
                          onClick={() => copyToClipboard(item.metadata.redeemCode!)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      <code className="block mt-2 font-mono text-sm bg-gray-800 p-2 rounded">
                        {item.metadata.redeemCode}
                      </code>
                    </div>
                  )}

                  {item.metadata?.voucherInfo && (
                    <div className="bg-gray-700/50 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Voucher Code:</span>
                        <button
                          onClick={() => copyToClipboard(item.metadata.voucherInfo!.code)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      <code className="block font-mono text-sm bg-gray-800 p-2 rounded">
                        {item.metadata.voucherInfo.code}
                      </code>
                      {item.metadata.voucherInfo.instructions && (
                        <div className="text-sm text-gray-300">
                          <p className="font-semibold mb-1">Instructions:</p>
                          <p>{item.metadata.voucherInfo.instructions}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-sm text-gray-400">
                    Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FaHistory className="text-4xl text-gray-500 mb-3 mx-auto" />
                      <p className="text-gray-400">No purchase history yet</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {order._id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="relative h-8 w-8 rounded overflow-hidden">
                                <Image
                                  src={item.item.image}
                                  alt={item.item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <span className="text-sm">{item.item.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1">
                          <FaCoins className="text-yellow-400" />
                          <span>{order.totalAmount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${order.status === 'completed' ? 'bg-green-500' :
                            order.status === 'pending' ? 'bg-yellow-500' :
                            order.status === 'refunded' ? 'bg-blue-500' : 'bg-red-500'}
                        `}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 