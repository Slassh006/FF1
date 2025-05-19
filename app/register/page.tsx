'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaGift } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import Turnstile from '@/app/components/auth/Turnstile';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user/profile');
      }
    }
  }, [session, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!turnstileToken) {
      toast.error('Please complete the security verification');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      toast.success('Registration successful! Please log in.');
      router.push('/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error(errorMessage);
      console.error('Registration Submit Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Define shared input classes for consistency (same as admin new user)
  const inputBaseClass = "block w-full rounded-lg border bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-2";
  const inputBorderClass = "border-gray-700 focus:border-primary focus:ring-primary";
  const inputPaddingClass = "pl-10 pr-3 py-2"; // Keep padding for icons
  const inputClass = `${inputBaseClass} ${inputBorderClass} ${inputPaddingClass}`;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black px-4 py-12">
      <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md border border-primary/20">
        <h1 className="text-2xl font-bold text-white mb-6 text-center font-orbitron">
          Create Your Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
            <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
              Full Name
            </label>
            <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                className={inputClass}
                required
                placeholder="Enter your full name"
                />
              </div>
            </div>

          {/* Email Field */}
            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
              Email
            </label>
            <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                className={inputClass}
                required
                placeholder="your@email.com"
                />
              </div>
            </div>

          {/* Password Field */}
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
              Password
            </label>
            <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                className={inputClass}
                required
                placeholder="Create a password"
                />
              </div>
            </div>

          {/* Confirm Password Field */}
            <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
              Confirm Password
            </label>
            <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                className={inputClass}
                required
                placeholder="Confirm your password"
                />
            </div>
          </div>

          {/* Turnstile Verification */}
          <div className="flex justify-center">
            <Turnstile onVerify={setTurnstileToken} />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-dark bg-primary hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-400 font-rajdhani">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 