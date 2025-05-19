'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaBoxOpen, FaCoins, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { format } from 'date-fns'; // For formatting dates

// Define the structure of the order data fetched from GET /api/orders
// Ensure this matches the select fields in the API route
interface OrderItem {
    storeItemId: string;
    name: string;
    category: string;
    coinCost: number;
    quantity: number;
    // Revealed details might be fetched separately if needed
}

interface Order {
    _id: string;
    totalCoinCost: number;
    status: string; // e.g., 'Completed', 'Pending'
    items: OrderItem[];
    createdAt: string; // Date string from API
}

export default function MyOrdersPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/orders');
             if (response.status === 401) {
                 toast.error('Please login to view your orders.');
                 setOrders([]);
                 return;
             }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch orders');
            }
            const data: Order[] = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error(error instanceof Error ? error.message : 'Could not load orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            fetchOrders();
        } else if (sessionStatus === 'unauthenticated') {
            setLoading(false);
            setOrders([]);
            toast.error('Login to view your orders.');
        }
    }, [sessionStatus]);

    const formatOrderId = (id: string) => {
        return `...${id.slice(-8)}`; // Show last 8 chars
    };

    const formatOrderDate = (dateString: string) => {
        try {
             return format(new Date(dateString), 'PPpp'); // Format like: Sep 21, 2023, 4:30:15 PM
        } catch (e) {
            return 'Invalid Date';
        }
    };

    if (loading || sessionStatus === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <FaSpinner className="animate-spin text-blue-500 text-4xl" />
            </div>
        );
    }

    return (
        // Assuming this page might be nested within a profile layout later
        // Add padding/container if needed
        <div className="p-4 md:p-8">
             <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">My Orders</h1>

            {orders.length === 0 ? (
                <div className="text-center text-gray-400 py-16 bg-gray-800 rounded-lg shadow-lg">
                    <FaBoxOpen className="mx-auto text-6xl text-gray-600 mb-4" />
                    <p className="text-xl mb-2">You haven't placed any orders yet.</p>
                    <Link href="/store">
                         <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Start Shopping
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                            {/* Order Header */}
                            <div className="flex flex-wrap justify-between items-center mb-4 border-b border-gray-700 pb-3">
                                <div>
                                    <p className="text-sm text-gray-400">Order ID</p>
                                     <p className="font-mono text-gray-300" title={order._id}>{formatOrderId(order._id)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Date Placed</p>
                                    <p className="text-gray-300 text-sm">{formatOrderDate(order.createdAt)}</p>
                                </div>
                                <div>
                                     <p className="text-sm text-gray-400">Total Cost</p>
                                     <p className="font-semibold text-white flex items-center">
                                        <FaCoins className="text-yellow-400 mr-1"/> {order.totalCoinCost}
                                    </p>
                                </div>
                                 <div>
                                    <p className="text-sm text-gray-400">Status</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'Completed' ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                 {/* Optional: View Details Button/Link */}
                                {/* <Link href={`/profile/orders/${order._id}`}> */}
                                    {/* <button className="text-blue-400 hover:underline text-sm">View Details</button> */}
                                {/* </Link> */}
                            </div>
                            
                            {/* Order Items Summary */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Items ({order.items.length}):</h4>
                                <ul className="space-y-1 text-xs list-disc list-inside pl-2">
                                    {order.items.slice(0, 3).map((item, index) => ( // Show first few items
                                        <li key={`${order._id}-item-${index}`} className="text-gray-400">
                                            {item.quantity} x {item.name} 
                                             {/* <span className="text-gray-500">({item.coinCost} coins each)</span> */} 
                                        </li>
                                    ))}
                                    {order.items.length > 3 && (
                                        <li className="text-gray-500 italic">+ {order.items.length - 3} more...</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 