'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaUser, FaCoins, FaShoppingCart, FaHistory, FaUserFriends, 
  FaCode, FaImage, FaTrophy, FaBell, FaCog, FaSignOutAlt,
  FaStore, FaGift, FaShareAlt, FaChartLine, FaCamera, FaGlobe, FaCheck, FaTimes, FaHeart, FaCopy, FaLink, FaUsers, FaUserEdit, 
  FaCalendarAlt, FaFileUpload
} from 'react-icons/fa';
import AvatarUpload from '../components/AvatarUpload';
import { toast } from 'react-hot-toast';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'subscriber';
  avatar?: string;
  coins: number;
  referralCode: string;
  createdAt: Date;
}

interface ProfileStats {
  totalQuizzes: number;
  totalWallpapersSaved: number;
  totalCodesSubmitted: number;
  totalCoinsEarned: number;
  referralCount: number;
  purchaseCount: number;
}

interface CraftlandSubmission {
  _id?: string;
  code: string;
  region: string;
  description?: string;
  status: 'pending' | 'verified' | 'removed' | 'rejected';
  upvotes: number;
  downvotes: number;
  likes: number;
  createdAt: string;
}

interface OverviewData {
  coinBalance: number;
  joinDate: string | null;
  referralsCount: number;
  submissionsCount: number;
  ordersCount: number;
  avatar?: string | null;
  avatarLastUpdatedAt?: string | Date | null;
}

const regions = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MENA', name: 'Middle East', flag: '🌍' },
  { code: 'US', name: 'North America', flag: '🌎' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺' },
];

const ProfilePage = () => {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [newCode, setNewCode] = useState({
    code: '',
    region: 'IN',
    description: ''
  });
  const [myCodes, setMyCodes] = useState<CraftlandSubmission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralReward, setReferralReward] = useState<number>(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (status === 'authenticated') {
        setLoadingUser(true);
        setLoadingOverview(true);
        try {
          const basicUser = session.user as User;
          setUser(basicUser);
          setLoadingUser(false);

          const overviewRes = await fetch('/api/profile/overview');
          if (!overviewRes.ok) {
            const errorData = await overviewRes.json();
            throw new Error(errorData.error || 'Failed to fetch overview stats');
          }
          const overviewStats: OverviewData = await overviewRes.json();
          setOverviewData(overviewStats);
          
        } catch (error: any) {
          console.error("Failed to load profile data:", error);
          toast.error(error.message || 'Could not load your profile. Please try again.');
          setOverviewData(null);
        } finally {
          setLoadingUser(false);
          setLoadingOverview(false);
        }
      }
    };
    fetchInitialData();
  }, [status, session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user data');
      }

      setUser(data.user);
      // Fetch user stats
      const statsResponse = await fetch('/api/user/stats');
      const statsData = await statsResponse.json();
    } catch (error) {
      toast.error('Could not load your profile. Please try again.');
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchReferralReward = async () => {
    try {
      const response = await fetch('/api/settings/public?key=referralCoinReward');
      if (response.ok) {
        const data = await response.json();
        if (typeof data.value === 'number') {
          setReferralReward(data.value);
        }
      } else {
        console.error('Failed to fetch referral reward setting.');
        // Keep default value
      }
    } catch (error) {
      console.error('Error fetching referral reward:', error);
       // Keep default value
    }
  };

  const handleAvatarUpdate = (newAvatar: string) => {
    if (user) {
      setUser({ ...user, avatar: newAvatar });
    }
  };

  // Fetch user's submitted codes
  useEffect(() => {
    const fetchMyCodes = async () => {
      try {
        const response = await fetch('/api/profile/craftland-codes');
        const data = await response.json();
        if (data.success) {
          setMyCodes(data.codes);
        }
      } catch (error) {
        console.error('Error fetching codes:', error);
      }
    };

    if (session?.user) {
      fetchMyCodes();
    }
  }, [session]);

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/craftland-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCode),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Craftland code submitted successfully!');
        setNewCode({ code: '', region: 'IN', description: '' });
        setMyCodes([data.code, ...myCodes]);
      } else {
        throw new Error(data.error || 'Failed to submit code');
      }
    } catch (error: any) {
      toast.error('Could not add code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this code?')) return;

    try {
      const response = await fetch(`/api/craftland-codes/${codeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Code deleted successfully');
        setMyCodes(myCodes.filter(code => code._id !== codeId));
      } else {
        throw new Error('Failed to delete code');
      }
    } catch (error: any) {
      toast.error('Could not remove code. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
    toast.success('Logged out successfully');
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type === 'code' ? 'Referral Code' : 'Referral Link'} copied!`);
      if (type === 'code') setCopiedCode(true);
      if (type === 'link') setCopiedLink(true);
      setTimeout(() => {
        if (type === 'code') setCopiedCode(false);
        if (type === 'link') setCopiedLink(false);
      }, 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Could not copy. Try again.');
    }
  };

  if (status === 'loading' || (status === 'authenticated' && (loadingUser || loadingOverview))) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user || !user) {
    return <div className="p-6 text-center text-red-500">User data unavailable. Please try logging in again.</div>;
  }

  // Helper for Stat Card
  const StatCard = ({ icon: Icon, label, value, link }: { icon: React.ElementType, label: string, value: string | number, link?: string }) => {
      const content = (
          <div className="bg-secondary p-4 rounded-lg text-center border border-primary/20 hover:border-primary/40 transition-colors">
            <Icon className="mx-auto text-primary text-2xl mb-2" />
            <p className="text-white font-bold text-xl">{value}</p>
            <p className="text-white/70 text-sm mt-1">{label}</p>
          </div>
      );
      return link ? <Link href={link}>{content}</Link> : content;
  };

  // Format Join Date
  const formattedJoinDate = overviewData?.joinDate 
      ? format(new Date(overviewData.joinDate), 'MMMM d, yyyy') 
      : 'N/A';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 bg-dark p-6 rounded-lg border border-primary/20">
        <div className="relative">
          {user && overviewData ? (
            <AvatarUpload
              currentAvatar={overviewData.avatar}
              userName={user.name}
              onAvatarUpdate={handleAvatarUpdate}
              avatarLastUpdatedAt={overviewData.avatarLastUpdatedAt}
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-800/50 flex items-center justify-center border-2 border-primary/20">
              <LoadingSpinner size="large" />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          {user ? (
            <>
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              <p className="text-white/70">{user.email}</p>
              <span className="inline-block bg-primary/20 text-primary text-xs font-medium px-2 py-0.5 rounded mt-2 capitalize">
                {user.role}
              </span>
              <p className="text-white/60 text-sm mt-2 flex items-center justify-center sm:justify-start gap-2">
                <FaCalendarAlt /> Member since {formattedJoinDate}
              </p>
            </>
          ) : (
            <>
              <div className="h-8 bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-24 mt-2 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-48 mt-2 animate-pulse"></div>
            </>
          )}
        </div>
      </div>

      {/* Profile Overview Content */}
      <div className="space-y-6">
        {/* Stats Grid */}
        <h2 className="text-xl font-semibold text-white mb-4">Account Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard icon={FaCoins} label="Coin Balance" value={overviewData?.coinBalance ?? '0'} />
          <StatCard icon={FaUserFriends} label="Referrals" value={overviewData?.referralsCount ?? '0'} link="/profile/referrals"/>
          <StatCard icon={FaFileUpload} label="Submissions" value={overviewData?.submissionsCount ?? '0'} link="/profile/submissions"/>
          <StatCard icon={FaShoppingCart} label="Orders" value={overviewData?.ordersCount ?? '0'} link="/profile/orders"/>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/profile/settings" className="block bg-secondary p-4 rounded-lg text-center hover:bg-primary/10 transition-colors border border-primary/20">
              <FaCog className="mx-auto text-primary text-2xl mb-2" />
              <span className="text-white font-medium text-sm">Settings</span>
            </Link>
            <Link href="/profile/submissions" className="block bg-secondary p-4 rounded-lg text-center hover:bg-primary/10 transition-colors border border-primary/20">
              <FaFileUpload className="mx-auto text-primary text-2xl mb-2" />
              <span className="text-white font-medium text-sm">My Submissions</span>
            </Link>
            <Link href="/profile/referrals" className="block bg-secondary p-4 rounded-lg text-center hover:bg-primary/10 transition-colors border border-primary/20">
              <FaShareAlt className="mx-auto text-primary text-2xl mb-2" />
              <span className="text-white font-medium text-sm">Invite Friends</span>
            </Link>
            <Link href="/store" className="block bg-secondary p-4 rounded-lg text-center hover:bg-primary/10 transition-colors border border-primary/20">
              <FaStore className="mx-auto text-primary text-2xl mb-2" />
              <span className="text-white font-medium text-sm">Visit Store</span>
            </Link>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="text-center pt-4">
          <button 
            onClick={handleSignOut}
            className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto border border-red-600/50"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 