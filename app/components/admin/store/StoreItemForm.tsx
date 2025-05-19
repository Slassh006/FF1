'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface StoreItemFormProps {
  item?: {
    _id: string;
    name: string;
    description: string;
    price: number;
    type: 'redeem_code' | 'digital_reward';
    image: string;
    status: 'draft' | 'active' | 'expired';
    inventory: number;
    metadata: {
      redeemCode?: string;
      voucherInfo?: {
        provider: string;
        code: string;
        instructions: string;
      };
      expiryDate?: string;
    };
  };
  onClose: () => void;
  onSave: () => void;
}

export default function StoreItemForm({ item, onClose, onSave }: StoreItemFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    type: item?.type || 'redeem_code',
    status: item?.status || 'draft',
    inventory: item?.inventory || 0,
    image: null as File | null,
    redeemCode: item?.metadata?.redeemCode || '',
    voucherProvider: item?.metadata?.voucherInfo?.provider || '',
    voucherCode: item?.metadata?.voucherInfo?.code || '',
    voucherInstructions: item?.metadata?.voucherInfo?.instructions || '',
    expiryDate: item?.metadata?.expiryDate || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      const response = await fetch(
        item ? `/api/admin/store/items/${item._id}` : '/api/admin/store/items',
        {
          method: item ? 'PATCH' : 'POST',
          body: formDataToSend,
        }
      );

      if (!response.ok) throw new Error('Failed to save item');

      toast.success(`Item ${item ? 'updated' : 'created'} successfully`);
      onSave();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {item ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price (coins)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'redeem_code' | 'digital_reward' }))}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="redeem_code">Redeem Code</option>
                  <option value="digital_reward">Digital Reward</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'active' | 'expired' }))}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Inventory</label>
                <input
                  type="number"
                  value={formData.inventory}
                  onChange={e => setFormData(prev => ({ ...prev, inventory: Number(e.target.value) }))}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Image</label>
              <div className="flex items-center space-x-4">
                <label className="flex-1 px-4 py-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center">
                    <FaUpload className="mr-2" />
                    <span>Choose Image</span>
                  </div>
                </label>
                {formData.image && (
                  <span className="text-sm text-gray-400">
                    {formData.image.name}
                  </span>
                )}
              </div>
            </div>

            {/* Type-specific Fields */}
            {formData.type === 'redeem_code' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Redeem Code</label>
                <input
                  type="text"
                  value={formData.redeemCode}
                  onChange={e => setFormData(prev => ({ ...prev, redeemCode: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Voucher Provider</label>
                  <input
                    type="text"
                    value={formData.voucherProvider}
                    onChange={e => setFormData(prev => ({ ...prev, voucherProvider: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Voucher Code</label>
                  <input
                    type="text"
                    value={formData.voucherCode}
                    onChange={e => setFormData(prev => ({ ...prev, voucherCode: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Instructions</label>
                  <textarea
                    value={formData.voucherInstructions}
                    onChange={e => setFormData(prev => ({ ...prev, voucherInstructions: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Expiry Date (Optional)</label>
              <input
                type="datetime-local"
                value={formData.expiryDate}
                onChange={e => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 