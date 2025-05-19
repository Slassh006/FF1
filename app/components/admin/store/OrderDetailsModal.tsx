'use client';

import { useState } from 'react';
import { FaTimes, FaCheck, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { Order, OrderStatus } from '@/app/types/store';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

export default function OrderDetailsModal({ order, onClose, onStatusChange }: OrderDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-500';
      case OrderStatus.COMPLETED:
        return 'bg-green-500';
      case OrderStatus.CANCELLED:
        return 'bg-red-500';
      case OrderStatus.REFUNDED:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleStatusChange = async () => {
    if (!onStatusChange) return;
    
    if (newStatus === order.status) {
      toast.error('Status is already set to this value');
      return;
    }
    
    setLoading(true);
    
    try {
      await onStatusChange(newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Order Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
              disabled={loading}
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order Information</h3>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="font-mono">{order._id}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Total Amount:</span>
                  <span className="font-bold">{order.totalAmount} coins</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Created:</span>
                  <span>{formatDate(new Date(order.createdAt))}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span>{formatDate(new Date(order.updatedAt))}</span>
                </div>
              </div>
              
              {/* Status Update Section */}
              {onStatusChange && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-3">Update Status</h4>
                  
                  <div className="flex items-center space-x-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="flex-1 px-3 py-2 bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value={OrderStatus.PENDING}>Pending</option>
                      <option value={OrderStatus.COMPLETED}>Completed</option>
                      <option value={OrderStatus.CANCELLED}>Cancelled</option>
                      <option value={OrderStatus.REFUNDED}>Refunded</option>
                    </select>
                    
                    <button
                      onClick={handleStatusChange}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || newStatus === order.status}
                    >
                      {loading ? (
                        <>
                          <FaTimesCircle className="animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <FaCheck />
                          <span>Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Name:</span>
                  <span>{order.user.name}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Email:</span>
                  <span>{order.user.email}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span className="font-mono">{order.user._id}</span>
                </div>
              </div>
              
              {/* Payment Information */}
              <h3 className="text-lg font-semibold">Payment Information</h3>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-mono">{order.paymentDetails.transactionId}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Method:</span>
                  <span>{order.paymentDetails.method}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Timestamp:</span>
                  <span>{formatDate(new Date(order.paymentDetails.timestamp))}</span>
                </div>
                
                {order.paymentDetails.coinBalanceBefore !== undefined && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Balance Before:</span>
                    <span>{order.paymentDetails.coinBalanceBefore} coins</span>
                  </div>
                )}
                
                {order.paymentDetails.coinBalanceAfter !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance After:</span>
                    <span>{order.paymentDetails.coinBalanceAfter} coins</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Order Items */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            
            <div className="bg-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-center">Quantity</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {order.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-600 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden">
                            <img
                              src={item.item.image}
                              alt={item.item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span>{item.item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{item.type}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{item.priceAtPurchase} coins</td>
                      <td className="px-4 py-3 text-right">{item.priceAtPurchase * item.quantity} coins</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-800">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-bold">Total:</td>
                    <td className="px-4 py-3 text-right font-bold">{order.totalAmount} coins</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* Special Items (Redeem Codes, Digital Rewards) */}
            {order.metadata && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Special Items</h3>
                
                {order.metadata.redeemCodes && order.metadata.redeemCodes.length > 0 && (
                  <div className="bg-gray-700 p-4 rounded-lg mb-4">
                    <h4 className="text-md font-medium mb-3">Redeem Codes</h4>
                    <div className="space-y-2">
                      {order.metadata.redeemCodes.map((code, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-600 p-2 rounded">
                          <span className="font-mono">{code}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(code);
                              toast.success('Code copied to clipboard');
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            aria-label="Copy code"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {order.metadata.badgeIds && order.metadata.badgeIds.length > 0 && (
                  <div className="bg-gray-700 p-4 rounded-lg mb-4">
                    <h4 className="text-md font-medium mb-3">Badges</h4>
                    <div className="flex flex-wrap gap-2">
                      {order.metadata.badgeIds.map((badgeId, index) => (
                        <div key={index} className="bg-gray-600 px-3 py-1 rounded-full">
                          {badgeId}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {order.metadata.rewardIds && order.metadata.rewardIds.length > 0 && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-md font-medium mb-3">Digital Rewards</h4>
                    <div className="flex flex-wrap gap-2">
                      {order.metadata.rewardIds.map((rewardId, index) => (
                        <div key={index} className="bg-gray-600 px-3 py-1 rounded-full">
                          {rewardId}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Close Button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 