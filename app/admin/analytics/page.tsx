'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FaChartLine,
  FaUsers,
  FaExclamationTriangle,
  FaGlobe,
  FaSync,
  FaDownload,
  FaArrowUp,
  FaShieldAlt,
  FaClock,
  FaThumbsUp,
  FaFileAlt,
  FaBolt,
  FaUserShield,
  FaCopy
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ActiveUserMatrix from '../../components/admin/ActiveUserMatrix';

interface AnalyticsData {
  code_submission?: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    fraudulent: number;
    daily: Array<{ date: string; count: number }>;
    hourly: Array<{ hour: number; count: number }>;
  };
  user_engagement?: {
    totalUsers: number;
    activeUsers: number;
    averageVotesPerUser: number;
    averageSubmissionsPerUser: number;
    userRetention: Array<{ day: number; percentage: number }>;
  };
  fraud_detection?: {
    totalDetected: number;
    byType: {
      rapidSubmissions: number;
      suspiciousVoting: number;
      duplicateCodes: number;
    };
    daily: Array<{ date: string; count: number }>;
    topRegions: Array<{ region: string; count: number }>;
  };
  regional_distribution?: {
    regions: Array<{
      code: string;
      name: string;
      totalCodes: number;
      verifiedCodes: number;
      activeUsers: number;
      fraudRate: number;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData>({});
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
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchAnalytics();
    }
  }, [session]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetch('/api/admin/analytics/update', { method: 'POST' });
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error refreshing analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/analytics/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analytics-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-dark p-4 rounded-lg hover:bg-dark/80 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className="bg-primary/20 p-2 rounded-full">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center text-sm">
          <FaArrowUp className={`${trend > 0 ? 'text-green-500' : 'text-red-500'} mr-1`} />
          <span className={trend > 0 ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(trend)}%
          </span>
          <span className="text-gray-400 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-400">Loading analytics data...</p>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
        <div className="flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Monitor your Craftland Codes system performance</p>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg transition-colors"
            title="Refresh analytics data"
          >
            <FaSync className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg transition-colors"
            title="Export analytics data to CSV"
          >
            <FaDownload className="w-5 h-5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>
      <ActiveUserMatrix />

      {/* Code Submission Trends */}
      <div className="bg-secondary rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FaChartLine className="text-primary" />
            Code Submission Trends
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Submissions"
            value={analytics.code_submission?.total || 0}
            icon={FaChartLine}
            color="text-white"
          />
          <StatCard
            title="Verified Codes"
            value={analytics.code_submission?.verified || 0}
            icon={FaShieldAlt}
            color="text-green-400"
            trend={5}
          />
          <StatCard
            title="Pending Codes"
            value={analytics.code_submission?.pending || 0}
            icon={FaClock}
            color="text-yellow-400"
            trend={-2}
          />
          <StatCard
            title="Fraudulent Codes"
            value={analytics.code_submission?.fraudulent || 0}
            icon={FaExclamationTriangle}
            color="text-red-400"
            trend={-10}
          />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.code_submission?.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#9CA3AF' }}
                formatter={(value: any) => [value, 'Submissions']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                name="Daily Submissions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Engagement */}
      <div className="bg-secondary rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FaUsers className="text-primary" />
            User Engagement
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Users"
            value={analytics.user_engagement?.totalUsers || 0}
            icon={FaUsers}
            color="text-white"
          />
          <StatCard
            title="Active Users"
            value={analytics.user_engagement?.activeUsers || 0}
            icon={FaUserShield}
            color="text-blue-400"
            trend={8}
          />
          <StatCard
            title="Avg. Votes/User"
            value={analytics.user_engagement?.averageVotesPerUser?.toFixed(1) || 0}
            icon={FaThumbsUp}
            color="text-purple-400"
            trend={3}
          />
          <StatCard
            title="Avg. Submissions/User"
            value={analytics.user_engagement?.averageSubmissionsPerUser?.toFixed(1) || 0}
            icon={FaFileAlt}
            color="text-green-400"
            trend={12}
          />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.user_engagement?.userRetention}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="day" 
                stroke="#9CA3AF"
                tickFormatter={(value) => `${value} days`}
              />
              <YAxis 
                stroke="#9CA3AF"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#9CA3AF' }}
                formatter={(value: any) => [`${value}%`, 'Retention']}
                labelFormatter={(label) => `${label} days`}
              />
              <Legend />
              <Bar 
                dataKey="percentage" 
                fill="#3B82F6"
                name="User Retention"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fraud Detection */}
      <div className="bg-secondary rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FaExclamationTriangle className="text-primary" />
            Fraud Detection
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Detected"
            value={analytics.fraud_detection?.totalDetected || 0}
            icon={FaExclamationTriangle}
            color="text-red-400"
          />
          <StatCard
            title="Rapid Submissions"
            value={analytics.fraud_detection?.byType?.rapidSubmissions || 0}
            icon={FaBolt}
            color="text-yellow-400"
            trend={-5}
          />
          <StatCard
            title="Suspicious Voting"
            value={analytics.fraud_detection?.byType?.suspiciousVoting || 0}
            icon={FaUserShield}
            color="text-orange-400"
            trend={-8}
          />
          <StatCard
            title="Duplicate Codes"
            value={analytics.fraud_detection?.byType?.duplicateCodes || 0}
            icon={FaCopy}
            color="text-purple-400"
            trend={-3}
          />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.fraud_detection?.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelStyle={{ color: '#9CA3AF' }}
                formatter={(value: any) => [value, 'Fraud Cases']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                name="Daily Fraud Cases"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional Distribution */}
      <div className="bg-secondary rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FaGlobe className="text-primary" />
            Regional Distribution
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.regional_distribution?.regions}
                  dataKey="totalCodes"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {analytics.regional_distribution?.regions?.map((entry, index) => (
                    <Cell key={entry.code || index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value: any, name: any) => [`${value} codes`, name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {analytics.regional_distribution?.regions?.map((region, index) => (
              <div key={region.code || index} className="bg-dark p-4 rounded-lg hover:bg-dark/80 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold">{region.name}</p>
                    <p className="text-gray-400 text-sm">
                      {region.totalCodes} codes ({region.verifiedCodes} verified)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      region.fraudRate > 10 ? 'text-red-400' : 
                      region.fraudRate > 5 ? 'text-yellow-400' : 
                      'text-green-400'
                    }`}>
                      {region.fraudRate.toFixed(1)}%
                    </p>
                    <p className="text-gray-400 text-sm">fraud rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 