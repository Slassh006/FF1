'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaUserFriends, FaCopy, FaShareAlt, FaCheck, FaCoins, FaLink } from 'react-icons/fa';
import { format } from 'date-fns';

interface ReferredUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export default function ReferralsPage() {
  const { data: session } = useSession();
  const [referrals, setReferrals] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalReferrals: 0,
  });
  const [referralReward, setReferralReward] = useState<number | null>(null);
  const [loadingReward, setLoadingReward] = useState(true);

  // Fetch referrals and public settings
  useEffect(() => {
    let isMounted = true;

    const fetchReferrals = async () => {
      try {
        const response = await fetch('/api/profile/referrals');
        if (!response.ok) throw new Error('Failed to fetch referrals');
        const data = await response.json();
        if (isMounted) {
          const fetchedReferrals = data.referredUsers || [];
          setReferrals(fetchedReferrals);
          setStats({ totalReferrals: fetchedReferrals.length });
        }
      } catch (err: any) {
        console.error('Error fetching referrals:', err);
        if (isMounted) setError(err.message);
        toast.error('Could not load referrals. Please try again.');
      }
    };

    const fetchPublicSettings = async () => {
        try {
            setLoadingReward(true);
            const response = await fetch('/api/settings/public');
            if (!response.ok) throw new Error('Failed to fetch settings');
            const settings = await response.json();
            if (isMounted && settings.referralCoinReward !== undefined) {
                setReferralReward(settings.referralCoinReward);
            }
        } catch (err: any) {
            console.error('Error fetching public settings:', err);
            if (isMounted) setReferralReward(1);
        } finally {
             if (isMounted) setLoadingReward(false);
        }
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([
          session?.user?.id ? fetchReferrals() : Promise.resolve(),
          fetchPublicSettings()
      ]);
      if (isMounted) setLoading(false);
    };

    loadData();

    return () => { isMounted = false; };
  }, [session]);

  // Copy to clipboard function (generalized)
  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type === 'code' ? 'Referral Code' : 'Referral Link'} copied!`);
      // Maybe manage separate copied states if needed, or just use one
      setCopied(true); 
      setTimeout(() => {
        setCopied(false);
      }, 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Could not copy. Try again.');
    }
  };

  // Share referral link
  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${session?.user?.referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Free Fire India',
        text: 'Join Free Fire India using my referral code and get bonus coins!',
        url: referralLink
      }).catch(err => {
        console.error('Error sharing:', err);
        navigator.clipboard.writeText(referralLink);
        toast.success('Referral link copied to clipboard');
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  // Determine the reward text based on state
  let rewardText = '...'; // Default while loading
  if (!loadingReward) {
    if (referralReward === 1) {
      rewardText = '1 coin';
    } else if (referralReward !== null && referralReward > 0) {
      rewardText = `${referralReward} coins`;
    } else {
      // Fallback if reward is null, undefined, 0, or negative after loading
      // Using '1 coin' as the fallback based on previous catch block logic
      rewardText = '1 coin'; 
    }
  }

  // Construct referral link
  const referralLinkBase = typeof window !== 'undefined' ? window.location.origin : '';
  const referralCode = session?.user?.referralCode;
  const referralLink = referralCode ? `${referralLinkBase}/register?ref=${referralCode}` : '';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Invite Friends</h2>
        <div className="flex items-center gap-2">
          <FaUserFriends className="text-primary" />
          <span className="text-white/70">{stats.totalReferrals} friends joined</span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="bg-dark rounded-lg p-6 space-y-5">
        <div>
            <h3 className="text-lg font-medium text-white mb-3">Your Referral Code</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-grow w-full sm:w-auto">
                <div className="bg-secondary rounded-lg p-3 flex items-center justify-between"> 
                  <code className="text-primary font-mono text-lg break-all mr-2">{referralCode || 'N/A'}</code>
                  <button 
                    onClick={() => referralCode && copyToClipboard(referralCode, 'code')}
                    disabled={!referralCode}
                    className="bg-primary/20 text-primary p-2 rounded-lg hover:bg-primary/30 transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy Code"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>
              <button 
                onClick={shareReferralLink}
                disabled={!referralCode}
                className="bg-primary text-black px-5 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/80 transition w-full sm:w-auto flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Share Referral Link"
              >
                <FaShareAlt /> <span>Share</span>
              </button>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium text-white mb-3">Your Referral Link</h3>
            <div className="flex items-center gap-4">
              <input 
                type="text" 
                readOnly 
                value={referralLink || 'Generating...'}
                className="flex-grow w-full bg-secondary rounded-lg p-3 text-white/80 text-sm truncate disabled:opacity-60 focus:outline-none"
                title={referralLink}
                disabled={!referralLink}
              />
              <button 
                onClick={() => referralLink && copyToClipboard(referralLink, 'link')}
                disabled={!referralLink}
                className="bg-primary/20 text-primary p-3 rounded-lg hover:bg-primary/30 transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copy Link"
              >
                 {copied ? <FaCheck /> : <FaLink />}
              </button>
            </div>
        </div>
        
        <div className="pt-2 text-white/70 text-sm">
          <p>Share your referral code or link with friends and earn coins when they join!</p>
          <p className="mt-1">
            You'll receive <span className="text-primary font-medium">{rewardText}</span> for each friend who joins using your code.
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Your Referrals</h3>
        
        {referrals.length === 0 ? (
          <p className="text-white/70 text-center py-4">You haven't referred anyone yet. Share your code!</p>
        ) : (
          <div className="bg-dark rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-700">
              {referrals.map((referral) => (
                <li key={referral._id} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition">
                  <div className="flex items-center gap-4">
                    <img 
                      src={referral.avatar || '/default-avatar.png'}
                      alt={referral.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-white font-medium">{referral.name}</p>
                      <p className="text-sm text-white/70">{referral.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm text-white/70">Joined:</p>
                     <p className="text-sm text-white/70">{format(new Date(referral.createdAt), 'PP')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 