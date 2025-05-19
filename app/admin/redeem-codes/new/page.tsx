'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Helper to get default expiry (e.g., 7 days from now)
const getDefaultExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
};

const NewRedeemCodePage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    reward: '',
    description: '',
    expiryDate: getDefaultExpiry(),
    maxUses: '',
    isActive: true
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate a random code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Format: XXXX-XXXX-XXXX-XXXX
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) result += '-';
    }
    
    setFormData(prev => ({
      ...prev,
      code: result
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate form
    if (!formData.code || !formData.reward || !formData.expiryDate) {
      setError('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare redeem code data for submission
      const redeemCodeData = {
        code: formData.code,
        reward: formData.reward,
        description: formData.description,
        expiryDate: formData.expiryDate,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null
      };
      
      // Submit to API
      const response = await fetch('/api/redeem-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(redeemCodeData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create redeem code');
      }
      
      // Show success message
      alert('Redeem code added successfully!');
      console.log('Created redeem code:', result.code);
      
      // Redirect to redeem codes list
      router.push('/admin/redeem-codes');
    } catch (err) {
      console.error('Error submitting redeem code:', err);
      setError('Failed to add redeem code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date for expiry (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="mr-4 text-white/70 hover:text-white"
          aria-label="Go back"
        >
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">Add New Redeem Code</h1>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-secondary rounded-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white mb-2">Code <span className="text-red-500">*</span></label>
            <div className="flex">
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Enter redeem code (e.g. ABCD-1234-EFGH-5678)"
                className="flex-grow bg-dark text-white py-2 px-4 rounded-l-md border border-primary/30 focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={generateRandomCode}
                className="bg-primary text-black px-4 py-2 rounded-r-md hover:bg-primary/80 transition"
              >
                Generate
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="reward" className="block text-white mb-2">Reward <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="reward"
              name="reward"
              value={formData.reward}
              onChange={handleChange}
              placeholder="E.g. 2x Diamond Royale Vouchers"
              className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
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
              placeholder="Detailed description of what the player will receive"
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
              min={today}
              className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="maxUses" className="block text-white mb-2">Maximum Uses</label>
            <input
              type="number"
              id="maxUses"
              name="maxUses"
              value={formData.maxUses}
              onChange={handleChange}
              min="0"
              placeholder="Leave empty for unlimited"
              className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
            />
            <p className="text-white/50 text-sm mt-1">Leave empty for unlimited uses</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-primary/20">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-primary/30 text-white rounded-md hover:bg-primary/10 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-primary text-black rounded-md hover:bg-primary/80 transition"
            disabled={isSubmitting}
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Adding...' : 'Add Redeem Code'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRedeemCodePage; 