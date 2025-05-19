/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaUserFriends, FaCopy, FaShareAlt, FaCheck, FaCoins } from 'react-icons/fa';
import { format } from 'date-fns';

// Update interface to match the referred User document structure
interface ReferredUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string; // Keep as string, will format later
}

// Renamed from ReferralsPage to ReferralsTabContent
export default function ReferralsTabContent() {
  const { data: session } = useSession();
  const [referrals, setReferrals] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalReferrals: 0,
  });

  // Fetch referrals
  useEffect(() => {
    // --- DEBUG: Log session data ---
    console.log('ReferralsTabContent Session Data:', session);
    // --- END DEBUG ---

    const fetchReferrals = async () => {
      // If the component isn't active/visible, maybe don't fetch?
      // This depends on how the tab component is implemented.
      // For now, fetch whenever the session is available.
      try {
        setLoading(true);
        setError(''); // Clear previous errors
        const response = await fetch('/api/profile/referrals');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch referrals' }));
          throw new Error(errorData.message || 'Failed to fetch referrals');
        }

        const data = await response.json();
        // Ensure we are accessing the correct key from the API response
        const fetchedReferrals = data.referredUsers || [];
        setReferrals(fetchedReferrals);

        // Calculate stats - Simplified to just total count
        setStats({
          totalReferrals: fetchedReferrals.length,
        });

      } catch (err: any) {
        console.error('Error fetching referrals:', err);
        setError(err.message);
        toast.error('Failed to load referrals data');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if session is loaded and user ID exists
    if (session?.user?.id) {
      fetchReferrals();
    } else if (session === null) {
      // Handle logged out state if necessary (e.g., clear data)
      setReferrals([]);
      setStats({ totalReferrals: 0 });
      setLoading(false);
    }
    // Add dependency on session status as well if needed
  }, [session]);

  // Copy referral code to clipboard
  const copyReferralCode = () => {
    if (session?.user?.referralCode) {
      navigator.clipboard.writeText(session.user.referralCode);
      setCopied(true);
      toast.success('Referral code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Referral code not available');
    }
  };

  // Share referral link
  const shareReferralLink = () => {
    if (!session?.user?.referralCode) {
        toast.error('Referral code not available to share');
        return;
    }
    const referralLink = `${window.location.origin}/register?ref=${session.user.referralCode}`;

    if (navigator.share) {
      navigator.share({
        title: 'Join Free Fire India',
        text: 'Join Free Fire India using my referral code and get bonus coins!',
        url: referralLink
      }).catch(err => {
        console.error('Error sharing:', err);
        // Fallback to copy link if share fails
        navigator.clipboard.writeText(referralLink);
        toast.success('Referral link copied to clipboard');
      });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard');
    }
  };

  // No session loaded yet
  if (session === undefined) {
      return (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-white/70">Loading session...</p>
        </div>
      );
  }

  // No user logged in
  if (session === null) {
      return (
          <div className="p-6 text-center text-white/70">
              Please log in to view your referrals.
          </div>
      );
  }

  // Main content render
  return (
    // Removed outer container assuming the layout/tab component provides padding
    <div className="space-y-8"> 
      {/* Top section with title and total count */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Invite Friends & Earn Coins</h2>
        <div className="flex items-center gap-2">
          <FaUserFriends className="text-primary" />
          <span className="text-white/70">{stats.totalReferrals} friends joined</span>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-dark rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Your Referral Code</h3>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="bg-secondary rounded-lg p-4 flex items-center justify-between">
              {/* Display placeholder if code is missing */}
              <code className="text-primary font-mono text-lg truncate">{session?.user?.referralCode || 'N/A'}</code>
              <button
                onClick={copyReferralCode}
                className="bg-primary/20 text-primary p-2 rounded-lg hover:bg-primary/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Copy referral code"
                disabled={!session?.user?.referralCode}
              >
                {copied ? <FaCheck /> : <FaCopy />}
              </button>
            </div>
          </div>

          <button
            onClick={shareReferralLink}
            className="bg-primary text-black px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!session?.user?.referralCode}
          >
            <FaShareAlt /> Share Link
          </button>
        </div>

        <div className="mt-4 text-white/70 text-sm">
          <p>Share your referral code with friends. You'll both get bonus coins when they register!</p>
          {/* TODO: Make the reward amount dynamic from config/backend? */}
          <p className="mt-1">You currently receive <span className="text-primary font-medium">100 coins</span> for each friend who joins.</p>
        </div>
      </div>

      {/* Loading/Error states for the list */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-white/70">Loading referrals...</p>
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Referrals List Section */}
      {!loading && !error && (
        <div>
          <h3 className="text-lg font-medium text-white mb-4">Friends Who Joined Using Your Code</h3>

          {referrals.length === 0 ? (
            <div className="bg-dark rounded-lg p-6 text-center text-white/70">
              You haven't referred anyone yet. Share your code!
            </div>
          ) : (
            <div className="bg-dark rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-700">
                {referrals.map((referral) => (
                  <li key={referral._id} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition">
                    <div className="flex items-center gap-4">
                      <img
                        src={referral.avatar || '/images/default-avatar.png'} // Use a consistent default avatar path
                        alt={`${referral.name}'s avatar`}
                        className="w-10 h-10 rounded-full object-cover bg-gray-700"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-avatar.png'; }} // Fallback for broken image links
                      />
                      <div>
                        <p className="text-white font-medium truncate">{referral.name}</p>
                        <p className="text-sm text-white/70 truncate">{referral.email}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-white/50">Joined:</p>
                      {/* Format the date */}
                      <p className="text-sm text-white/70">{format(new Date(referral.createdAt), 'PP')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 