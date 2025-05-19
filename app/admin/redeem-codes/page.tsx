'use client';

import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaCopy, FaCheck, FaEye } from 'react-icons/fa';
import Link from 'next/link';
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

export default function AdminRedeemCodesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch redeem codes from API
  useEffect(() => {
    const fetchRedeemCodes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/redeem-codes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch redeem codes');
        }
        
        const data = await response.json();
        setRedeemCodes(data.codes || []);
      } catch (err) {
        console.error('Error fetching redeem codes:', err);
        setError('Failed to load redeem codes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRedeemCodes();
  }, []);
  
  // Filter redeem codes based on search term and status filter
  const filteredCodes = redeemCodes.filter(code => {
    const matchesSearch = 
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.reward.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && code.isActive) ||
      (statusFilter === 'expired' && !code.isActive);
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort redeem codes by expiry date (most recent first)
  const sortedCodes = [...filteredCodes].sort((a, b) => {
    if (!a.isActive && b.isActive) return 1;
    if (a.isActive && !b.isActive) return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle code deletion
  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redeem code? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/redeem-codes?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete redeem code');
      }
      
      // Update the UI by removing the deleted code
      setRedeemCodes(prevCodes => prevCodes.filter(code => code._id !== id));
      toast.success('Redeem code deleted successfully');
    } catch (err) {
      console.error('Error deleting redeem code:', err);
      toast.error('Failed to delete redeem code');
    }
  };

  // Handle toggle active status
  const toggleActiveStatus = async (code: RedeemCode) => {
    try {
      const response = await fetch('/api/redeem-codes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: code._id,
          isActive: !code.isActive,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update redeem code');
      }
      
      // Update the UI
      setRedeemCodes(prevCodes => 
        prevCodes.map(c => 
          c._id === code._id ? { ...c, isActive: !c.isActive } : c
        )
      );
      
      toast.success(`Redeem code ${code.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error('Error updating redeem code:', err);
      toast.error('Failed to update redeem code');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Redeem Codes</h1>
        <Link
          href="/admin/redeem-codes/new"
          className="flex items-center bg-primary text-black px-4 py-2 rounded-md hover:bg-primary/80 transition"
        >
          <FaPlus className="mr-2" /> Add New Code
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search redeem codes or rewards..."
              className="w-full bg-secondary text-white py-2 px-4 pl-10 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-white/50" />
          </div>
        </div>
        
        <div className="md:col-span-1">
          <select
            className="w-full bg-secondary text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Codes</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>
      
      <div className="bg-secondary rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary border-b border-gray-700">
                <th className="py-3 px-6 text-left">Code</th>
                <th className="py-3 px-6 text-left">Reward</th>
                <th className="py-3 px-6 text-left">Expiry Date</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr key="loading">
                  <td colSpan={5} className="py-8 px-6 text-center text-gray-400">
                    Loading redeem codes...
                  </td>
                </tr>
              ) : sortedCodes.length === 0 ? (
                <tr key="empty">
                  <td colSpan={5} className="py-8 px-6 text-center text-gray-400">
                    No redeem codes found
                  </td>
                </tr>
              ) : (
                sortedCodes.map((code) => (
                  <tr key={code._id} className="border-b border-gray-700 hover:bg-gray-800/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{code.code}</span>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="text-gray-400 hover:text-white transition"
                          title="Copy code"
                        >
                          {copiedCode === code.code ? <FaCheck size={14} /> : <FaCopy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">{code.reward}</td>
                    <td className="py-4 px-6">{formatDate(code.expiryDate)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          code.isActive
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}
                      >
                        {code.isActive ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/admin/redeem-codes/edit/${code._id}`}
                          className="text-blue-400 hover:text-blue-300 transition"
                          title="Edit code"
                        >
                          <FaEdit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteCode(code._id)}
                          className="text-red-400 hover:text-red-300 transition"
                          title="Delete code"
                        >
                          <FaTrash size={18} />
                        </button>
                        <button
                          onClick={() => toggleActiveStatus(code)}
                          className={`${
                            code.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                          } transition`}
                          title={code.isActive ? 'Deactivate code' : 'Activate code'}
                        >
                          <FaEye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 