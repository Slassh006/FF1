'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaBell, FaEnvelope, FaCheck, FaTrash, FaSpinner } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
// Don't import the Mongoose Document type here
// import { INotification } from '@/app/models/Notification'; 

interface NotifyMailDropdownProps {
  onClose: () => void;
}

// Define a plain interface for frontend state
interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    type: string;
    createdAt: string; // Keep as string from JSON
}

// Placeholder Mail type if needed later
interface MailItem {
  id: string;
  subject: string;
  sender?: string;
  receivedAt: string;
  read: boolean;
}

const NotifyMailDropdown: React.FC<NotifyMailDropdownProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'mails'>('notifications');
  // Use the plain interface for state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]); 
  const [mails, setMails] = useState<MailItem[]>([]); // Empty for now
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const limit = 10; // Number of items per fetch

  const fetchNotifications = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notifications/list?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      if (data.success) {
        // Assume API returns plain objects compatible with NotificationItem
        const fetchedNotifications = data.notifications as NotificationItem[]; 
        setNotifications(prev => page === 1 ? fetchedNotifications : [...prev, ...fetchedNotifications]);
        setHasMoreNotifications(data.pagination.currentPage < data.pagination.totalPages);
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
    } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
  }, [limit]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications(1); // Fetch first page on tab activation
    }
    // Add logic for fetching mails if implemented later
  }, [activeTab, fetchNotifications]);

  const loadMoreNotifications = () => {
    if (hasMoreNotifications && !loading) {
      const nextPage = notificationPage + 1;
      setNotificationPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const handleMarkRead = async (id: string, isNotification: boolean) => {
    if (!isNotification) return;
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      setNotifications(prev => 
        prev.map((n: NotificationItem) => (n._id === id ? { ...n, read: true } : n))
      );
      toast.success('Marked as read');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string, isNotification: boolean) => {
    if (!isNotification) return;
    try {
      const response = await fetch(`/api/notifications/delete?notificationId=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
       setNotifications(prev => prev.filter((n: NotificationItem) => n._id !== id));
       toast.success('Deleted successfully');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleMarkAllRead = async () => {
     try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      setNotifications(prev => prev.map((n: NotificationItem) => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
     try {
      const response = await fetch(`/api/notifications/delete?deleteAll=true`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete all');
       setNotifications([]);
       toast.success('All deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  const renderEmptyState = () => (
    <div className="p-4 text-center text-gray-400 text-sm">No items found.</div>
  );

  const renderLoading = () => (
    <div className="p-4 flex justify-center items-center">
      <FaSpinner className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="absolute top-full right-0 mt-2 w-80 max-w-sm bg-secondary shadow-lg rounded-lg border border-primary/20 z-50 overflow-hidden">
      {/* Header with Tabs */}
      <div className="flex border-b border-primary/10">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-white/70 hover:bg-primary/5'}`}
        >
          <FaBell /> Notifications
        </button>
        <button
          onClick={() => setActiveTab('mails')}
          className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'mails' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-white/70 hover:bg-primary/5'}`}
        >
          <FaEnvelope /> Mails
        </button>
      </div>

      {/* Content Area */}
      <div className="max-h-96 overflow-y-auto">
        {loading && notificationPage === 1 && renderLoading()}
        {error && <div className="p-4 text-center text-red-400 text-sm">{error}</div>}
        
        {/* Notifications Tab Content */}
        {activeTab === 'notifications' && !loading && notifications.length === 0 && renderEmptyState()}
        {activeTab === 'notifications' && notifications.length > 0 && (
          <ul>
            {notifications.map((n: NotificationItem) => (
              <li key={n._id} className={`border-b border-primary/10 p-3 hover:bg-primary/5 ${!n.read ? 'bg-primary/10' : ''}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${!n.read ? 'text-white' : 'text-white/80'}`}>{n.title}</p>
                    <p className={`text-xs mt-0.5 ${!n.read ? 'text-white/70' : 'text-white/50'}`}>{n.message}</p>
                    <span className="text-xs text-blue-400/70 mt-1 block">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {!n.read && (
                        <button onClick={() => handleMarkRead(n._id, true)} title="Mark as Read" className="text-green-500/70 hover:text-green-400 p-0.5">
                            <FaCheck size={12}/>
                        </button>
                    )}
                     <button onClick={() => handleDelete(n._id, true)} title="Delete" className="text-red-500/70 hover:text-red-400 p-0.5">
                        <FaTrash size={12} />
                    </button>
                  </div>
                </div>
                {n.link && <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 block">View Details</a>}
              </li>
            ))}
            {hasMoreNotifications && (
                <li className="p-2 text-center">
                    <button onClick={loadMoreNotifications} disabled={loading} className="text-xs text-primary hover:underline disabled:opacity-50">
                        {loading ? <FaSpinner className="animate-spin inline mr-1"/> : 'Load More'}
                    </button>
                </li>
            )}
          </ul>
        )}

        {/* Mails Tab Content (Placeholder) */}
        {activeTab === 'mails' && renderEmptyState()} 

      </div>

       {/* Footer with Actions */}
       <div className="flex justify-between items-center p-2 border-t border-primary/10 bg-secondary/50">
           <button onClick={handleMarkAllRead} className="text-xs text-blue-400 hover:underline px-2 py-1" disabled={activeTab === 'mails' || loading || notifications.filter(n => !n.read).length === 0}>
               Mark All Read
           </button>
           <button onClick={handleDeleteAll} className="text-xs text-red-500 hover:underline px-2 py-1" disabled={activeTab === 'mails' || loading || notifications.length === 0}>
               Delete All
           </button>
       </div>

    </div>
  );
};

export default NotifyMailDropdown; 