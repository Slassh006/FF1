'use client';

import React, { useState, useEffect } from 'react';
import { FaSearch, FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface RedeemCode {
  id: string;
  code: string;
  reward: string;
  description: string;
  expiresAt: string;
  maxUses?: number;
  usedCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RedeemCodesPage() {
  const [searchTerm, setSearchTerm] = useState('');
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to load redeem codes';
        console.error('Error fetching redeem codes:', err);
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRedeemCodes();
  }, []);

  // Filter active codes based on search term
  const filteredCodes = redeemCodes.filter(code => {
    if (!code.isActive) return false;
    
    return (
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.reward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (code.description && code.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard!');
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if the date is valid after parsing
      if (isNaN(date.getTime())) {
          return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        // Optional: Add time formatting if desired
        // hour: '2-digit',
        // minute: '2-digit',
        // timeZoneName: 'short' 
      });
    } catch (e) {
       console.error("Error formatting date:", e);
       return 'Invalid Date';
    }
  };

  // Get time remaining until expiry
  const getTimeRemaining = (expiryDate: string) => {
    try {
        const now = new Date();
        const expiry = new Date(expiryDate);
        // Check if the expiry date is valid
        if (isNaN(expiry.getTime())) {
            return 'Invalid Date';
        }

        const diff = expiry.getTime() - now.getTime();
        
        if (diff <= 0) return 'Expired';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h remaining`;
        if (hours > 0) return `${hours}h ${minutes}m remaining`; // Show minutes if less than a day
        return `${minutes}m remaining`; // Show only minutes if less than an hour
    } catch (e) {
        console.error("Error calculating time remaining:", e);
        return 'Error';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white font-orbitron mb-8 text-center">
        Free Fire Redeem Codes
      </h1>
      
      <div className="max-w-3xl mx-auto">
        {/* Search bar */}
        <div className="bg-secondary rounded-lg p-4 mb-8 border border-primary/20">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Search by code or reward..."
              className="w-full bg-dark text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {/* How to redeem guide */}
        <div className="bg-secondary rounded-lg p-6 mb-8 border border-primary/20">
          <h2 className="text-xl font-bold text-white mb-4">How to Redeem Codes</h2>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>Visit the official Free Fire Redemption website at <a href="https://reward.ff.garena.com/" target="_blank" rel="noopener noreferrer" className="text-primary">reward.ff.garena.com</a></li>
            <li>Log in using your Free Fire account (Facebook, Google, VK, etc.)</li>
            <li>Copy a code from below and paste it into the redemption text field</li>
            <li>Click 'Confirm' to complete the redemption process</li>
            <li>Open Free Fire on your device and check the in-game mail for your rewards</li>
          </ol>
        </div>
        
        {/* Codes list */}
        <h2 className="text-xl font-bold text-white mb-4">Active Redeem Codes</h2>
        
        {loading ? (
          <div className="bg-secondary rounded-lg p-8 text-center border border-primary/20">
            <p className="text-white/60">Loading redeem codes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : filteredCodes.length > 0 ? (
          <div className="space-y-4">
            {(() => {
              // Check for duplicate keys before mapping
              const ids = filteredCodes.map(c => c.id);
              const uniqueIds = new Set(ids);
              if (ids.length !== uniqueIds.size) {
                console.warn('WARNING: Duplicate keys detected in filteredCodes!', ids);
              } else {
                console.log('Keys appear unique:', ids);
              }
              
              // Original map function
              return filteredCodes.map((code, idx) => {
                // Prefer id, fallback to code+expiresAt, fallback to index (with warning)
                let key = code.id;
                if (!key || ids.filter(id => id === key).length > 1) {
                  key = `${code.code}_${code.expiresAt}`;
                  // If still not unique, fallback to index
                  if (ids.filter(id => id === key).length > 1) {
                    console.warn('Falling back to index as key for code:', code);
                    key = `idx_${idx}`;
                  }
                }
                return (
                  <div key={key} className="bg-secondary rounded-lg p-4 border border-primary/20 hover:border-primary/50 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="mb-3 md:mb-0">
                        <div className="flex items-center">
                          <span className="font-mono bg-dark/50 px-3 py-1 rounded text-white text-lg tracking-wider">
                            {code.code}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(code.code)}
                            className="ml-3 p-2 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition"
                            title="Copy to clipboard"
                          >
                            {copiedCode === code.code ? <FaCheck /> : <FaCopy />}
                          </button>
                        </div>
                        <div className="mt-2">
                          <p className="text-white font-medium">{code.reward}</p>
                          {code.description && (
                            <p className="text-white/60 text-sm mt-1">{code.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end text-sm">
                        <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
                          {getTimeRemaining(code.expiresAt)}
                        </div>
                        <div className="text-white/50 mt-1">
                          Expires: {formatDate(code.expiresAt)}
                        </div>
                        {code.maxUses && (
                          <div className="text-white/50">
                            Uses: {code.usedCount || 0} / {code.maxUses}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="bg-secondary rounded-lg p-8 text-center border border-primary/20">
            <p className="text-white/50">
              No active redeem codes found. {searchTerm && 'Try a different search term.'}
            </p>
          </div>
        )}
        
        {/* Disclaimer */}
        <div className="mt-8 text-white/60 text-sm">
          <p>* Redeem codes are time-limited and may expire at any time.</p>
          <p>* Some codes may be region-specific and may not work in all regions.</p>
          <p>* There is a limit on how many times a particular code can be redeemed.</p>
        </div>
      </div>
    </div>
  );
} 