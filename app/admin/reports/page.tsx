'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaCheck, FaTimes, FaEye, FaTrash } from 'react-icons/fa';
import Link from 'next/link';

interface Report {
  _id: string;
  userId: string;
  reason: string;
  category: string;
  details?: string;
  createdAt: string;
  status: string;
}

interface CraftlandCode {
  _id: string;
  title: string;
  code: string;
  reports: Report[];
  reportCount: number;
  isFraudulent: boolean;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportedCodes, setReportedCodes] = useState<CraftlandCode[]>([]);
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
    const fetchReportedCodes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/reports');
        
        if (!response.ok) {
          throw new Error('Failed to fetch reported codes');
        }
        
        const data = await response.json();
        setReportedCodes(data.reportedCodes);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchReportedCodes();
    }
  }, [session]);

  const handleResolveReport = async (codeId: string, reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const response = await fetch(`/api/admin/reports/${codeId}/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      setReportedCodes(prev => 
        prev.map(code => {
          if (code._id === codeId) {
            return {
              ...code,
              reports: code.reports.map(report => 
                report._id === reportId 
                  ? { ...report, status: action === 'resolve' ? 'resolved' : 'dismissed' }
                  : report
              ),
              reportCount: code.reports.filter(r => r.status === 'pending').length
            };
          }
          return code;
        })
      );

      toast.success(`Report ${action === 'resolve' ? 'resolved' : 'dismissed'} successfully`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this code? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/craftland-codes/${codeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete code');
      }

      setReportedCodes(prev => prev.filter(code => code._id !== codeId));
      toast.success('Code deleted successfully');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Reported Codes</h1>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {reportedCodes.map(code => (
          <div key={code._id} className="bg-secondary rounded-lg p-6 border border-primary/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{code.title}</h2>
                <p className="text-primary font-mono">{code.code}</p>
              </div>
              <div className="flex gap-2">
                <Link 
                  href={`/craftland-codes/${code._id}`}
                  className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30"
                  title="View Code"
                >
                  <FaEye />
                </Link>
                <button
                  onClick={() => handleDeleteCode(code._id)}
                  className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/40"
                  title="Delete Code"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {code.reports
                .filter(report => report.status === 'pending')
                .map(report => (
                  <div key={report._id} className="bg-dark/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-primary font-semibold">{report.category}</span>
                        <span className="text-white/50 ml-2">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveReport(code._id, report._id, 'resolve')}
                          className="p-2 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/40"
                          title="Resolve Report"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => handleResolveReport(code._id, report._id, 'dismiss')}
                          className="p-2 bg-yellow-900/30 text-yellow-400 rounded-lg hover:bg-yellow-900/40"
                          title="Dismiss Report"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                    <p className="text-white/80">{report.reason}</p>
                    {report.details && (
                      <p className="text-white/60 mt-2">{report.details}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        {reportedCodes.length === 0 && !loading && (
          <div className="text-center text-white/70 py-16">
            <p className="text-xl mb-2">No reported codes found.</p>
            <p>All reports have been resolved!</p>
          </div>
        )}
      </div>
    </div>
  );
} 