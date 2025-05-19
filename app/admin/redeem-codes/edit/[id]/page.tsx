'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface RedeemCode {
  _id: string;
  code: string;
  reward: string;
  description: string;
  expiryDate: string;
  maxUses?: number;
  usedCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Define the expected params structure
interface EditRedeemCodePageParams {
  id: string;
}

export default function EditRedeemCodePage({ params }: { params: Promise<EditRedeemCodePageParams> }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const id = resolvedParams.id; // Access id from the resolved object

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    reward: '',
    description: '',
    expiryDate: '',
    maxUses: '',
    isActive: true
  });

  // Function to format date to YYYY-MM-DDTHH:mm required by datetime-local
  const formatDateTimeLocal = (date: Date | string | null | undefined) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      // Adjust for timezone offset before formatting
      const timezoneOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
      const localDate = new Date(d.getTime() - timezoneOffset);
      return localDate.toISOString().slice(0, 16);
    } catch (e) {
      console.error("Error formatting date:", e);
      return ''; // Return empty string on error
    }
  };

  // Fetch redeem code data
  useEffect(() => {
    const fetchRedeemCode = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/redeem-codes/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch redeem code');
        }
        
        const data = await response.json();
        const code = data.code;
        
        setFormData({
          code: code.code,
          reward: code.reward,
          description: code.description || '',
          expiryDate: formatDateTimeLocal(code.expiresAt),
          maxUses: code.maxUses?.toString() || '',
          isActive: code.isActive
        });
      } catch (err) {
        console.error('Error fetching redeem code:', err);
        setError('Failed to load redeem code');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchRedeemCode();
    }
  }, [id]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/redeem-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update redeem code');
      }
      
      toast.success('Redeem code updated successfully');
      router.push('/admin/redeem-codes');
    } catch (err: any) {
      console.error('Error updating redeem code:', err);
      toast.error(err.message || 'Failed to update redeem code');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/redeem-codes"
            className="text-gray-400 hover:text-white transition"
          >
            <FaArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Edit Redeem Code</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="code" className="block text-white mb-2">Code <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
            required
          />
        </div>
        
        <div>
          <label htmlFor="reward" className="block text-white mb-2">Reward <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="reward"
            name="reward"
            value={formData.reward}
            onChange={handleChange}
            className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-white mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none resize-none"
          />
        </div>
        
        <div>
          <label htmlFor="expiryDate" className="block text-white mb-2">Expiry Date & Time <span className="text-red-500">*</span></label>
          <input
            type="datetime-local"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
            required
          />
        </div>
        
        <div>
          <label htmlFor="maxUses" className="block text-white mb-2">Max Uses</label>
          <input
            type="number"
            id="maxUses"
            name="maxUses"
            value={formData.maxUses}
            onChange={handleChange}
            min="1"
            className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="flex items-center space-x-2 text-white">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleCheckboxChange}
              className="form-checkbox bg-dark border-primary/30 text-primary rounded"
            />
            <span>Active</span>
          </label>
        </div>
        
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center bg-primary text-black px-6 py-2 rounded-md hover:bg-primary/80 transition"
          >
            <FaSave className="mr-2" /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
} 