'use client';

import { useState } from 'react';
import { FaCheck, FaTimes, FaClock, FaDownload, FaCopy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { Order, OrderStatus } from '@/app/types/store';

interface OrderDetailsProps {
  order: Order;
  isAdmin?: boolean;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

export default function OrderDetails({ order, isAdmin = false, onStatusChange }: OrderDetailsProps) {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return 'bg-green-500/20 text-green-400';
      case OrderStatus.CANCELLED:
        return 'bg-red-500/20 text-red-400';
      case OrderStatus.REFUNDED:
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!onStatusChange) return;
    
    try {
      setLoading(true);
      await onStatusChange(newStatus);
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Information</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="font-mono">{order._id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Total Amount:</span>
                <span className="font-bold">{order.totalAmount} coins</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span>{formatDate(new Date(order.createdAt))}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated:</span>
                <span>{formatDate(new Date(order.updatedAt))}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span>{order.user.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span>{order.user.email}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">User ID:</span>
                <span className="font-mono">{order.user._id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>
        
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-600">
                  <img
                    src={item.item.image}
                    alt={item.item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium">{item.item.name}</h4>
                  <p className="text-sm text-gray-400">Type: {item.type}</p>
                  <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.priceAtPurchase} coins</p>
                <p className="text-sm text-gray-400">Total: {item.priceAtPurchase * item.quantity} coins</p>
                {item.metadata?.redeemCode && (
                  <button
                    onClick={() => copyToClipboard(item.metadata.redeemCode!)}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <FaCopy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction ID:</span>
            <span className="font-mono">{order.paymentDetails.transactionId}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Method:</span>
            <span>{order.paymentDetails.method}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Timestamp:</span>
            <span>{formatDate(new Date(order.paymentDetails.timestamp))}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Balance Before:</span>
            <span>{order.paymentDetails.coinBalanceBefore} coins</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Balance After:</span>
            <span>{order.paymentDetails.coinBalanceAfter} coins</span>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && onStatusChange && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
          
          <div className="flex space-x-4">
            <button
              onClick={() => handleStatusChange(OrderStatus.COMPLETED)}
              disabled={loading || order.status === OrderStatus.COMPLETED}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FaCheck />
              <span>Mark as Completed</span>
            </button>
            
            <button
              onClick={() => handleStatusChange(OrderStatus.CANCELLED)}
              disabled={loading || order.status === OrderStatus.CANCELLED}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FaTimes />
              <span>Cancel Order</span>
            </button>
            
            <button
              onClick={() => handleStatusChange(OrderStatus.REFUNDED)}
              disabled={loading || order.status === OrderStatus.REFUNDED}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FaClock />
              <span>Process Refund</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 