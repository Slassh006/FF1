'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaUserPlus, FaTimes, FaSave } from 'react-icons/fa';

export default function NewUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'subscriber',
    coins: 0,
    permissions: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name.trim()) {
      toast.error('Name is required');
      setIsLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      setIsLoading(false);
      return;
    }
    if (!formData.password.trim()) {
      toast.error('Password is required');
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isAdmin: formData.role === 'admin'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      router.push('/admin/users');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) < 0 ? 0 : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const inputBaseClass = "mt-1 block w-full rounded-lg border bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-2";
  const inputBorderClass = "border-gray-700 focus:border-primary focus:ring-primary";
  const inputPaddingClass = "px-4 py-2";
  const inputClass = `${inputBaseClass} ${inputBorderClass} ${inputPaddingClass}`;

  return (
    <div className="max-w-2xl mx-auto bg-secondary p-6 md:p-8 rounded-lg shadow-lg border border-primary/20">
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 font-orbitron flex items-center">
        <FaUserPlus className="mr-3 text-primary"/> Create New User
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 font-rajdhani">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Enter user's full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 font-rajdhani">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Enter user's email address"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 font-rajdhani">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            className={inputClass}
            placeholder="Enter initial password (min 8 chars)"
          />
          <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters.</p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-300 font-rajdhani">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`${inputClass} appearance-none`}
          >
            <option value="subscriber">Subscriber</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label htmlFor="coins" className="block text-sm font-medium text-gray-300 font-rajdhani">
            Initial Coins
          </label>
          <input
            type="number"
            id="coins"
            name="coins"
            value={formData.coins}
            onChange={handleChange}
            min="0"
            className={inputClass}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-secondary"
          >
            <FaTimes/> Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-dark bg-primary border border-transparent rounded-lg shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave/> {isLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
} 