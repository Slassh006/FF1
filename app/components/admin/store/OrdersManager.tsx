import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Order {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  item: {
    name: string;
    price: number;
    type: string;
  };
  quantity: number;
  totalPrice: number;
  status: string;
  deliveryStatus: string;
  metadata: {
    deliveredItem?: string;
    deliveryDate?: string;
    failureReason?: string;
  };
  createdAt: string;
}

interface OrdersManagerProps {
  orders: Order[];
  onOrderUpdate: () => void;
}

export default function OrdersManager({ orders, onOrderUpdate }: OrdersManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.metadata.deliveredItem && order.metadata.deliveredItem.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId: string, status: string, deliveryStatus: string) => {
    try {
      const response = await fetch(`/api/admin/store/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, deliveryStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update order status');
      }

      toast.success('Order status updated successfully');
      onOrderUpdate();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search orders..."
          className="flex-1 px-4 py-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded-lg"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Order Date</th>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Item</th>
              <th className="px-6 py-3 text-left">Quantity</th>
              <th className="px-6 py-3 text-left">Total</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Delivery Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td className="px-6 py-4">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div>{order.user.name}</div>
                  <div className="text-sm text-gray-500">{order.user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div>{order.item.name}</div>
                  <div className="text-sm text-gray-500">{order.item.type}</div>
                </td>
                <td className="px-6 py-4">{order.quantity}</td>
                <td className="px-6 py-4">₹{order.totalPrice}</td>
                <td className="px-6 py-4">
                  <select
                    className="px-2 py-1 border rounded"
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value, order.deliveryStatus)}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="failed">Failed</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    className="px-2 py-1 border rounded"
                    value={order.deliveryStatus}
                    onChange={(e) => handleStatusUpdate(order._id, order.status, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  {order.metadata.deliveredItem && (
                    <div className="text-sm">
                      <div>Delivered: {order.metadata.deliveredItem}</div>
                      {order.metadata.deliveryDate && (
                        <div className="text-gray-500">
                          {new Date(order.metadata.deliveryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                  {order.metadata.failureReason && (
                    <div className="text-sm text-red-500">
                      {order.metadata.failureReason}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 