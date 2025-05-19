'use client';

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaTrash, 
  FaBan, 
  FaUserShield,
  FaUser,
  FaDownload,
  FaPlus,
  FaEdit,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaChevronDown
} from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';
import { Inter, Orbitron } from 'next/font/google';
import { Listbox, Transition } from '@headlessui/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string | null;
  createdAt: string;
  isAdmin: boolean;
}

const USERS_PER_PAGE = 10;

// Define a more comprehensive type for bulk actions
type BulkActionType = 'activate' | 'deactivate' | 'delete' | 'ban' | 'makeAdmin';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'subscriber', label: 'Subscriber' },
  // Add other roles if necessary
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<{ value: string; label: string }>(roleOptions[0]);
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const debouncedFetchUsers = useCallback(
    debounce((page: number, currentSearchTerm: string, currentRoleValue: string) => {
      fetchUsersInternal(page, currentSearchTerm, currentRoleValue);
    }, 500),
    []
  );

  const fetchUsersInternal = async (page = 1, currentSearch = searchTerm, currentRole = roleFilter.value) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: USERS_PER_PAGE.toString(),
        search: currentSearch,
        role: currentRole,
      });
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
      setTotalUsers(data.totalCount);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
      setSelectedUsers([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersInternal(currentPage, searchTerm, roleFilter.value);
  }, [currentPage]);

  useEffect(() => {
    debouncedFetchUsers(1, searchTerm, roleFilter.value);

    return () => {
      debouncedFetchUsers.cancel();
    };
  }, [searchTerm, roleFilter.value, debouncedFetchUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleBulkAction = async (action: BulkActionType) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user.');
      return;
    }

    const toastId = toast.loading(`Performing bulk action: ${action}...`);

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers, action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully performed bulk action: ${action} on ${selectedUsers.length} users.`, { id: toastId });
        fetchUsersInternal(); // Refresh users list
        setSelectedUsers([]); // Clear selection
      } else {
        throw new Error(data.error || `Failed to perform bulk action: ${action}`);
      }
    } catch (error: any) {
      console.error(`Error performing bulk action ${action}:`, error);
      toast.error(error.message || `Failed to perform bulk action: ${action}`, { id: toastId });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/export/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsersInternal();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-orbitron text-white mb-2">Users</h1>
          <p className="text-gray-400">Manage your website users</p>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaFilter className="w-5 h-5" />
            <span>Filters</span>
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaDownload className="w-5 h-5" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => router.push('/admin/users/new')}
            className="btn-primary flex items-center space-x-2"
          >
            <FaPlus className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-secondary p-4 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <label htmlFor="search-users" className="block text-sm text-gray-400 mb-1">Search</label>
              <div className="relative">
                <input
                  id="search-users"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email"
                  className="input-field pl-10"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="role-filter" className="block text-sm text-gray-400 mb-1">Role</label>
              <Listbox value={roleFilter} onChange={setRoleFilter}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-dark py-2 pl-3 pr-10 text-left text-white shadow-sm ring-1 ring-inset ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                    <span className="block truncate">{roleFilter.label}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {roleOptions.map((option) => (
                        <Listbox.Option
                          key={option.value}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-primary/20 text-primary' : 'text-white'
                            }`
                          }
                          value={option}
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${
                                  selected ? 'font-medium' : 'font-normal'
                                }`}
                              >
                                {option.label}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                  <FaCheck className="h-4 w-4" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </div>
        </div>
      )}

      {selectedUsers.length > 0 && (
        <div className="bg-secondary p-4 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleBulkAction('delete')}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaTrash className="w-5 h-5" />
              <span>Delete Selected</span>
            </button>
            
            <button
              onClick={() => handleBulkAction('ban')}
              className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaBan className="w-5 h-5" />
              <span>Ban Selected</span>
            </button>
            
            <button
              onClick={() => handleBulkAction('makeAdmin')}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaUserShield className="w-5 h-5" />
              <span>Make Admin</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-secondary rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-auto">
            <thead>
              <tr className="bg-secondary/50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(user => user.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-700"
                  />
                </th>
                <th className="px-4 py-3 text-left text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-gray-400">Last Login</th>
                <th className="px-4 py-3 text-left text-gray-400">Joined</th>
                <th className="px-4 py-3 text-left text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length > 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-400">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-400">No users found matching your criteria.</td>
                </tr>
              )}
              {!loading && users.map((user) => (
                <tr key={user.id} className="border-t border-gray-700 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <FaUser className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    <span className={`px-2 py-1 rounded text-xs ${user.isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-200'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <Link href={`/admin/users/edit/${user.id}`} passHref>
                        <button 
                          title="Edit User"
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          <FaEdit />
                        </button>
                      </Link>
                      <button 
                        title="Delete User"
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-red-500 hover:text-red-400"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-secondary p-3 rounded-lg">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="flex items-center px-3 py-1 rounded bg-primary text-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80"
          >
            <FaChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-gray-300">
            Page {currentPage} of {totalPages} (Total: {totalUsers} users)
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="flex items-center px-3 py-1 rounded bg-primary text-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/80"
          >
            Next
            <FaChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
} 