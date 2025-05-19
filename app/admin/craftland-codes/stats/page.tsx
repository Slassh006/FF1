'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaThumbsUp, FaThumbsDown, FaHeart, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';

interface CraftlandStats {
  totalCodes: number;
  verifiedCodes: number;
  pendingCodes: number;
  fraudulentCodes: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalLikes: number;
  topCreators: Array<{
    name: string;
    count: number;
  }>;
  popularCodes: Array<{
    code: string;
    title: string;
    upvotes: number;
    downvotes: number;
    likes: number;
  }>;
}

export default function CraftlandStats() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<CraftlandStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/craftland-codes/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        console.error('Error fetching statistics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchStats();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-secondary rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70">Total Codes</p>
              <h3 className="text-2xl font-bold text-white">{stats.totalCodes}</h3>
            </div>
            <FaUsers className="text-primary w-8 h-8" />
          </div>
        </div>

        <div className="bg-secondary rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70">Verified Codes</p>
              <h3 className="text-2xl font-bold text-green-400">{stats.verifiedCodes}</h3>
            </div>
            <FaShieldAlt className="text-green-400 w-8 h-8" />
          </div>
        </div>

        <div className="bg-secondary rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70">Pending Codes</p>
              <h3 className="text-2xl font-bold text-yellow-400">{stats.pendingCodes}</h3>
            </div>
            <FaUsers className="text-yellow-400 w-8 h-8" />
          </div>
        </div>

        <div className="bg-secondary rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70">Fraudulent Codes</p>
              <h3 className="text-2xl font-bold text-red-400">{stats.fraudulentCodes}</h3>
            </div>
            <FaExclamationTriangle className="text-red-400 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Interaction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70">Total Upvotes</p>
              <h3 className="text-2xl font-bold text-green-400">{stats.totalUpvotes}</h3>
            </div>
            <FaThumbsUp className="text-green-400 w-8 h-8" />
          </div>
        </div>

        <div className="bg-secondary rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70">Total Downvotes</p>
              <h3 className="text-2xl font-bold text-red-400">{stats.totalDownvotes}</h3>
            </div>
            <FaThumbsDown className="text-red-400 w-8 h-8" />
          </div>
        </div>

        <div className="bg-secondary rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70">Total Likes</p>
              <h3 className="text-2xl font-bold text-pink-400">{stats.totalLikes}</h3>
            </div>
            <FaHeart className="text-pink-400 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Top Creators */}
      <div className="bg-secondary rounded-lg p-6 border border-primary/20">
        <h2 className="text-xl font-bold text-white mb-4">Top Creators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.topCreators.map((creator, index) => (
            <div key={creator.name} className="bg-dark rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">{creator.name}</p>
                  <p className="text-white/70">{creator.count} codes</p>
                </div>
                <span className="text-2xl font-bold text-primary">#{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Codes */}
      <div className="bg-secondary rounded-lg p-6 border border-primary/20">
        <h2 className="text-xl font-bold text-white mb-4">Popular Codes</h2>
        <div className="space-y-4">
          {stats.popularCodes.map((code) => (
            <div key={code.code} className="bg-dark rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">{code.title}</p>
                  <p className="font-mono text-white/70">{code.code}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <FaThumbsUp className="text-green-400" />
                    <span className="text-white">{code.upvotes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaThumbsDown className="text-red-400" />
                    <span className="text-white">{code.downvotes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaHeart className="text-pink-400" />
                    <span className="text-white">{code.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 