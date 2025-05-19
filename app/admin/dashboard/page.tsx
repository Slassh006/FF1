'use client';

import React, { useState, useEffect } from 'react';
import type { IconType } from 'react-icons';
import { 
  FaNewspaper, 
  FaImages, 
  FaGift, 
  FaMap, 
  FaEye, 
  FaCalendarAlt,
  FaArrowUp,
  FaChartLine,
  FaBell,
  FaUsers,
  FaImage,
  FaCoins,
  FaDownload,
  FaFilter,
  FaPlus,
  FaTrash,
  FaBan
} from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalWallpapers: number;
  totalRedeemCodes: number;
  totalCraftlandCodes: number;
  totalCoinsIssued: number;
  activeUsers: number;
}

interface Activity {
  id: string;
  type: string;
  user: string;
  action: string;
  timestamp: string;
}

interface StatCardProps {
  icon: IconType;
  label: string;
  value: number;
  trend?: number;
}

interface QuickActionButtonProps {
  icon: IconType;
  label: string;
  onClick: () => void;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPosts: 0,
    totalWallpapers: 0,
    totalRedeemCodes: 0,
    totalCraftlandCodes: 0,
    totalCoinsIssued: 0,
    activeUsers: 0
  });

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent activity
      const activityResponse = await fetch('/api/admin/activity');
      const activityData = await activityResponse.json();
      setRecentActivity(activityData.activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dateRange }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-export.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const QuickActionButton = ({ icon: Icon, label, onClick }: QuickActionButtonProps) => (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 bg-primary/20 hover:bg-primary/30 text-white px-4 py-2 rounded-lg transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  const StatCard = ({ icon: Icon, label, value, trend }: StatCardProps) => (
    <div className="bg-secondary p-4 lg:p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <h3 className="text-xl lg:text-2xl font-bold text-white mt-1">
            {(value ?? 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-primary/20 p-2 lg:p-3 rounded-full">
          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 lg:mt-4 flex items-center text-sm">
          <FaChartLine className="text-green-500 mr-1" />
          <span className="text-green-500">{trend}% </span>
          <span className="text-gray-400 ml-1">vs last month</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome to your admin dashboard</p>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-secondary text-white border border-primary/50 hover:border-primary hover:bg-primary/10 px-4 py-2 rounded-lg transition-colors"
          >
            <FaFilter className="w-5 h-5" />
            <span>Filters</span>
          </button>
          
          <QuickActionButton
            icon={FaDownload}
            label="Export Stats"
            onClick={() => handleExport('stats')}
          />
        </div>
      </div>

      {/* Date Range Filter */}
      {showFilters && (
        <div className="bg-secondary p-4 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchDashboardData}
                className="btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={FaUsers}
          label="Total Users"
          value={stats.totalUsers}
          trend={12}
        />
        <StatCard
          icon={FaNewspaper}
          label="Total Posts"
          value={stats.totalPosts}
          trend={8}
        />
        <StatCard
          icon={FaImages}
          label="Wallpapers"
          value={stats.totalWallpapers}
          trend={15}
        />
        <StatCard
          icon={FaGift}
          label="Redeem Codes"
          value={stats.totalRedeemCodes}
          trend={5}
        />
        <StatCard
          icon={FaMap}
          label="Craftland Codes"
          value={stats.totalCraftlandCodes}
          trend={10}
        />
        <StatCard
          icon={FaCoins}
          label="Coins Issued"
          value={stats.totalCoinsIssued}
          trend={20}
        />
        <StatCard
          icon={FaUsers}
          label="Active Users"
          value={stats.activeUsers}
          trend={18}
        />
      </div>

      {/* Recent Activity with Export */}
      <div className="bg-secondary rounded-lg p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-white">Recent Activity</h2>
          <button
            onClick={() => handleExport('activity')}
            className="flex items-center space-x-2 text-primary hover:text-primary/80"
          >
            <FaDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-700"
            >
              <div>
                <p className="text-white">
                  <span className="font-medium">{activity.user}</span>{' '}
                  {activity.action}
                </p>
                <p className="text-sm text-gray-400">{activity.type}</p>
              </div>
              <span className="text-sm text-gray-400 mt-1 sm:mt-0">
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 