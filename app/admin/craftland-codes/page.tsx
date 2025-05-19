'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaCopy, FaCheck, FaThumbsUp, FaThumbsDown, FaHeart, FaShieldAlt, FaBan } from 'react-icons/fa';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Define Creator interface (consistent with public page)
interface Creator {
  _id?: string;
  name: string;
  image?: string;
}

interface CraftlandCode {
  _id: string;
  title: string;
  description: string;
  code: string;
  category: string;
  difficulty: string;
  creator?: Creator; // Use Creator interface
  createdAt: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  features: string[];
  downloadCount: number;
  upvotes: string[];
  downvotes: string[];
  likes: string[];
  isVerified: boolean;
  isFraudulent: boolean;
}

export default function AdminCraftlandCodesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [craftlandCodes, setCraftlandCodes] = useState<CraftlandCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  // Show error in UI
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Fetch craftland codes
  useEffect(() => {
    const fetchCraftlandCodes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/craftland', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch craftland codes');
        }
        
        const data = await response.json();
        setCraftlandCodes(data.craftlandCodes || []);
      } catch (err: any) {
        console.error('Error fetching craftland codes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchCraftlandCodes();
    }
  }, [session]);

  // Get all unique categories for filtering
  const categories = Array.from(new Set(craftlandCodes.map(code => code.category)));
  
  // Filter craftland codes based on search term and category filter
  const filteredCodes = craftlandCodes.filter(code => {
    const creatorName = code.creator?.name || ''; // Get creator name safely
    const matchesSearch = 
      code.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creatorName.toLowerCase().includes(searchTerm.toLowerCase()); // Search by name
    
    const matchesCategory = categoryFilter === 'all' || code.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Sort craftland codes by created date (most recent first)
  const sortedCodes = [...filteredCodes].sort((a, b) => {
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

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this craftland code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/craftland-codes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete craftland code');
      }

      setCraftlandCodes(prev => prev.filter(code => code._id !== id));
      toast.success('Craftland code deleted successfully');
    } catch (err: any) {
      console.error('Error deleting craftland code:', err);
      setError(err.message);
    }
  };

  // Handle verify
  const handleVerify = async (id: string, currentStatus: boolean) => {
    setVerifyingId(id);
    const newStatus = !currentStatus;
    setCraftlandCodes(prev => prev.map(code =>
        code._id === id ? { ...code, isVerified: newStatus } : code
    ));
    const toastId = `verify-${id}`;
    toast.loading(`Setting status to ${newStatus ? 'Verified' : 'Unverified'}...`, { id: toastId });

    try {
      const response = await fetch(`/api/admin/craftland-codes/${id}`, { 
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified: newStatus }), 
      });

      if (!response.ok) {
          let errorMsg = 'Failed to update verification status';
          try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
          } catch (parseError) {
              errorMsg = response.statusText || errorMsg;
          }
          throw new Error(errorMsg);
      }

      toast.success(newStatus ? 'Code is verified!' : 'Code is unverified!', { id: toastId });
    } catch (err: any) {
      console.error('Error updating verification status:', err);
      setError(err.message);
      toast.error(`Update failed: ${err.message}`, { id: toastId });
      setCraftlandCodes(prev => prev.map(code =>
        code._id === id ? { ...code, isVerified: currentStatus } : code
      ));
    } finally {
      setVerifyingId(null);
    }
  };

  // Handle mark fraudulent
  const handleMarkFraudulent = async (id: string, currentStatus: boolean) => {
     const newStatus = !currentStatus;
    setCraftlandCodes(prev => prev.map(code =>
        code._id === id ? { ...code, isFraudulent: newStatus } : code
    ));
    const toastId = `fraud-${id}`;
    toast.loading(`Setting status to ${newStatus ? 'Fraudulent' : 'Not Fraudulent'}...`, { id: toastId });

    try {
      const response = await fetch(`/api/admin/craftland-codes/${id}`, { 
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFraudulent: newStatus }), 
      });

      // Check response status BEFORE parsing JSON
      if (!response.ok) {
          let errorMsg = 'Failed to update fraudulent status';
          try {
              // Attempt to parse error response if it exists
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
          } catch (parseError) {
              // If parsing fails, use status text or default message
              errorMsg = response.statusText || errorMsg;
          }
          throw new Error(errorMsg);
      }

      // Only parse JSON if response is OK
      // const data = await response.json(); // Not strictly needed if just checking success

      toast.success('Fraudulent status updated!', { id: toastId });
    } catch (err: any) {
      console.error('Error updating fraudulent status:', err);
      setError(err.message);
      toast.error(`Update failed: ${err.message}`, { id: toastId });
       // Revert optimistic update on error
      setCraftlandCodes(prev => prev.map(code =>
        code._id === id ? { ...code, isFraudulent: currentStatus } : code
      ));
    }
  };

  if (status === 'loading') {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Craftland Codes</h1>
        <Link
          href="/admin/craftland-codes/new"
          className="flex items-center bg-primary text-black px-4 py-2 rounded-md hover:bg-primary/80 transition"
        >
          <FaPlus className="mr-2" /> Add New Code
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, code, or creator..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="bg-secondary rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary border-b border-white/10">
                <th className="py-3 px-4 text-left">Map Name</th>
                <th className="py-3 px-4 text-left">Code</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Creator</th>
                <th className="py-3 px-4 text-left">Added</th>
                <th className="py-3 px-4 text-left">Votes</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCodes.map((code: CraftlandCode) => (
                <tr key={code._id} className="border-b border-white/10 hover:bg-secondary/80">
                  <td className="py-3 px-4 text-white">{code.title}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <span className="font-mono text-white">{code.code}</span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="ml-2 text-gray-400 hover:text-primary"
                        aria-label="Copy code"
                      >
                        {copiedCode === code.code ? <FaCheck size={14} className="text-green-500" /> : <FaCopy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">{code.category}</span>
                  </td>
                  <td className="py-3 px-4 text-white">{code.creator?.name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-white/70">{formatDate(code.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <FaThumbsUp className="text-green-400" size={14} />
                        <span className="text-white/70">{code.upvotes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaThumbsDown className="text-red-400" size={14} />
                        <span className="text-white/70">{code.downvotes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaHeart className="text-pink-400" size={14} />
                        <span className="text-white/70">{code.likes?.length || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {code.isVerified ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                          <FaShieldAlt size={12} /> Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                          Pending
                        </span>
                      )}
                      {code.isFraudulent && (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                          Fraudulent
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {/* View Button commented out */}
                      {/* Edit Button - Corrected href AGAIN */}
                      <Link href={`/admin/craftland-codes/edit/${code._id}`} passHref> 
                        <button 
                          className="text-blue-400 hover:text-blue-300"
                          aria-label={`Edit ${code.title}`}
                          title="Edit Code"
                        >
                          <FaEdit size={18} />
                        </button>
                      </Link>
                      {/* Verify Button */}
                      <button 
                        onClick={() => handleVerify(code._id, code.isVerified)}
                        className={`p-1 rounded transition-colors duration-200 flex items-center justify-center
                          ${code.isVerified ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}
                          ${verifyingId === code._id ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title={code.isVerified ? 'Mark as Unverified' : 'Mark as Verified'}
                        disabled={verifyingId === code._id}
                      >
                        {verifyingId === code._id ? (
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                        <FaShieldAlt />
                        )}
                      </button>
                      {/* Mark Fraudulent Button */}
                      <button 
                        onClick={() => handleMarkFraudulent(code._id, !code.isFraudulent)}
                        className={`p-1 rounded ${code.isFraudulent ? 'text-red-500 hover:text-red-400' : 'text-gray-500 hover:text-red-400'}`}
                        title={code.isFraudulent ? 'Unmark as Fraudulent' : 'Mark as Fraudulent'}
                      >
                        <FaBan />
                      </button>
                      {/* Delete Button */}
                      <button 
                        className="text-red-400 hover:text-red-300"
                        aria-label={`Delete ${code.title}`}
                        onClick={() => handleDelete(code._id)}
                        title="Delete Code"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedCodes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-4 px-6 text-center text-white/60">
                    No craftland codes found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 