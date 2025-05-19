'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTrash, FaBan, FaUserShield } from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  coins: number;
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setUser(data);
    } catch (error) {
      setError('Failed to load user data');
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) throw new Error('Failed to update user');
      
      router.push('/admin/users');
    } catch (error) {
      setError('Failed to save changes');
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      router.push('/admin/users');
    } catch (error) {
      setError('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Edit User</h1>
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <FaSave className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaTrash className="w-5 h-5" />
            <span>Delete User</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-secondary rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="w-full bg-dark border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full bg-dark border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              value={user.role}
              onChange={(e) => setUser({ ...user, role: e.target.value })}
              className="w-full bg-dark border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="subscriber">Subscriber</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Coins</label>
            <input
              type="number"
              value={user.coins}
              onChange={(e) => setUser({ ...user, coins: parseInt(e.target.value) })}
              className="w-full bg-dark border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Permissions</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['create_post', 'edit_post', 'delete_post', 'manage_users', 'manage_content', 'manage_settings'].map((permission) => (
              <label key={permission} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={user.permissions.includes(permission)}
                  onChange={(e) => {
                    const newPermissions = e.target.checked
                      ? [...user.permissions, permission]
                      : user.permissions.filter(p => p !== permission);
                    setUser({ ...user, permissions: newPermissions });
                  }}
                  className="rounded border-gray-700"
                />
                <span className="text-white">{permission.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-400">
          <div>
            <p>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
          </div>
          <div>
            <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 