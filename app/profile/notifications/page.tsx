'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaTrash, FaSpinner, FaSearch, FaFilter, FaUndo, FaChevronDown } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import PaginationControls from '../../components/common/PaginationControls';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Define a plain interface matching the dropdown
interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    type: string;
    createdAt: string;
}

// Define Option type
interface SelectOption {
  value: string;
  label: string;
}

// Filter options
const filterOptions: SelectOption[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filter, setFilter] = useState<SelectOption>(filterOptions[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 15; // Items per page for full page view

    const fetchNotifications = useCallback(async (page: number, currentFilterValue: string, currentSearch: string) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (currentFilterValue !== 'all') params.append('filter', currentFilterValue);
            if (currentSearch) params.append('search', currentSearch);

            const response = await fetch(`/api/notifications/list?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const data = await response.json();

            if (data.success) {
                setNotifications(data.notifications as NotificationItem[]);
                setCurrentPage(data.pagination.currentPage);
                setTotalPages(data.pagination.totalPages);
                setTotalItems(data.pagination.totalItems);
            } else {
                throw new Error(data.error || 'Failed to fetch notifications');
            }
        } catch (err: any) {
            setError(err.message);
            setNotifications([]); // Clear data on error
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Initial fetch and fetch on dependency change
    useEffect(() => {
        fetchNotifications(currentPage, filter.value, searchTerm);
    }, [currentPage, filter.value, searchTerm, fetchNotifications]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleFilterChange = (selectedOption: SelectOption) => {
        setFilter(selectedOption);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        // Optional: Add debounce here if needed
    };
    
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page on search
        fetchNotifications(1, filter.value, searchTerm); // Trigger fetch immediately
    };
    
    const resetFilters = () => {
        setFilter(filterOptions[0]); // Reset to default object
        setSearchTerm('');
        setCurrentPage(1);
    };

    // --- Actions (similar to dropdown, could be refactored into a hook/service) ---
    const handleMarkRead = async (id: string) => {
        try {
            const response = await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id }),
            });
            if (!response.ok) throw new Error('Failed');
            setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
            toast.success('Marked as read');
            // TODO: Re-fetch or update unread count if displayed on this page
        } catch (err) { toast.error('Could not mark as read. Please try again.'); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this notification?')) return;
        try {
            const response = await fetch(`/api/notifications/delete?notificationId=${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed');
            setNotifications(prev => prev.filter(n => n._id !== id));
            setTotalItems(prev => prev -1); // Decrement total count
            toast.success('Deleted');
            // Check if current page becomes empty after delete
            if (notifications.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                // Re-fetch potentially needed if page count changes drastically
                // Or if you want perfect pagination count after delete
                fetchNotifications(currentPage, filter.value, searchTerm);
            }
        } catch (err) { toast.error('Could not delete notification. Please try again.'); }
    };

     const handleMarkAllRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) });
            if (!response.ok) throw new Error('Failed');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All marked as read');
        } catch (err) { toast.error('Could not mark all as read. Please try again.'); }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Delete ALL notifications? This cannot be undone.')) return;
        try {
            const response = await fetch(`/api/notifications/delete?deleteAll=true`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed');
            setNotifications([]);
            setTotalItems(0);
            setCurrentPage(1);
            setTotalPages(1);
            toast.success('All deleted');
        } catch (err) { toast.error('Could not delete all notifications. Please try again.'); }
    };
    // --- End Actions ---

    const listboxButtonClass = "bg-dark text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50 text-sm relative text-left";
    const listboxOptionsClass = "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-dark border border-primary/50 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm";

    return (
        <div className="p-4 md:p-6 bg-dark text-white min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-primary">My Notifications</h1>

            {/* Filter and Search Controls */}
            <div className="mb-6 p-4 bg-secondary rounded-lg shadow-md flex flex-wrap gap-4 items-center">
                <form onSubmit={handleSearchSubmit} className="flex-grow flex gap-2">
                    <input 
                        type="text"
                        placeholder="Search title or message..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="input-field flex-grow"
                    />
                    <button type="submit" className="btn-primary px-3 py-2 flex items-center justify-center">
                        <FaSearch />
                    </button>
                </form>
                <div className="flex items-center gap-2">
                    <label htmlFor="filter-listbox" className="text-sm text-white/70"><FaFilter className="inline mr-1"/> Status:</label>
                    <Listbox value={filter} onChange={handleFilterChange}>
                       <div className="relative min-w-[100px]">
                           <Listbox.Button id="filter-listbox" className={listboxButtonClass}>
                               <span className="block truncate">{filter.label}</span>
                               <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                   <FaChevronDown className="h-3 w-3 text-gray-400" aria-hidden="true" />
                               </span>
                           </Listbox.Button>
                           <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                               <Listbox.Options className={listboxOptionsClass}>
                                   {filterOptions.map((option) => (
                                       <Listbox.Option
                                           key={option.value}
                                           className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-primary/20 text-primary' : 'text-white'}`}
                                           value={option}
                                       >
                                           {({ selected }) => (
                                               <>
                                                   <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                                   {selected && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"><FaCheck className="h-4 w-4" aria-hidden="true" /></span>}
                                               </>
                                           )}
                                       </Listbox.Option>
                                   ))}
                               </Listbox.Options>
                           </Transition>
                       </div>
                    </Listbox>
                </div>
                 <button onClick={resetFilters} title="Reset Filters" className="btn-secondary px-3 py-2 flex items-center justify-center">
                    <FaUndo />
                 </button>
                 <button onClick={handleMarkAllRead} title="Mark All Read" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || notifications.filter(n => !n.read).length === 0}>
                    Mark All Read
                 </button>
                 <button onClick={handleDeleteAll} title="Delete All" className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading || notifications.length === 0}>
                    Delete All
                 </button>
            </div>

            {/* Notifications List */}
            {loading && (
                <div className="text-center p-10"><FaSpinner className="animate-spin text-primary text-4xl mx-auto" /></div>
            )}
            {!loading && error && (
                <div className="text-center p-10 text-red-400 bg-red-900/20 rounded-lg">Error: {error}</div>
            )}
            {!loading && !error && notifications.length === 0 && (
                <div className="text-center p-10 text-white/50 bg-secondary rounded-lg">You have no notifications.</div>
            )}
            {!loading && !error && notifications.length > 0 && (
                <div className="space-y-3">
                    {notifications.map((n) => (
                        <div key={n._id} className={`p-4 rounded-lg shadow-md flex gap-4 items-start transition-colors ${!n.read ? 'bg-primary/10 border border-primary/30' : 'bg-secondary hover:bg-secondary/80'}`}>
                           <div className="flex-grow">
                                <h2 className={`font-semibold mb-1 ${!n.read ? 'text-white' : 'text-white/90'}`}>{n.title}</h2>
                                <p className={`text-sm mb-2 ${!n.read ? 'text-white/80' : 'text-white/60'}`}>{n.message}</p>
                                <div className="flex items-center gap-4 text-xs text-white/50">
                                    <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                                    {n.link && <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Details</a>}
                                </div>
                           </div>
                           <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-1">
                                {!n.read && (
                                    <button onClick={() => handleMarkRead(n._id)} title="Mark as Read" className="text-green-500 hover:text-green-400 p-1">
                                        <FaCheck />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(n._id)} title="Delete" className="text-red-500 hover:text-red-400 p-1">
                                    <FaTrash />
                                </button>
                           </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
} 