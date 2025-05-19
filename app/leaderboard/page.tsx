'use client';

import { useEffect, useState } from 'react';
import Leaderboard from '@/app/components/Leaderboard';
import { FaTrophy, FaUsers, FaStar } from 'react-icons/fa';

interface LeaderboardData {
  creators: Array<{
    userId: string;
    name: string;
    avatar: string;
    score: number;
    badges: string[];
    rank: number;
  }>;
  voters: Array<{
    userId: string;
    name: string;
    avatar: string;
    score: number;
    badges: string[];
    rank: number;
  }>;
  contributors: Array<{
    userId: string;
    name: string;
    avatar: string;
    score: number;
    badges: string[];
    rank: number;
  }>;
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data = await response.json();
        setLeaderboardData(data.leaderboards);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading leaderboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900">Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Leaderboard</h1>
          <p className="text-xl text-gray-600">
            Celebrate our top contributors and community members
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FaTrophy className="text-yellow-500 text-2xl mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Top Creators</h2>
            </div>
            <Leaderboard
              items={leaderboardData?.creators || []}
              title="Top Code Creators"
              type="creators"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FaUsers className="text-blue-500 text-2xl mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Top Voters</h2>
            </div>
            <Leaderboard
              items={leaderboardData?.voters || []}
              title="Top Community Voters"
              type="voters"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FaStar className="text-purple-500 text-2xl mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Top Contributors</h2>
            </div>
            <Leaderboard
              items={leaderboardData?.contributors || []}
              title="Top Overall Contributors"
              type="contributors"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 