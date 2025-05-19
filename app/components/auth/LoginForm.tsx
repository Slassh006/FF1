import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { validateEmail } from '../../lib/validation';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import Link from 'next/link';

interface LoginFormProps {
  isAdmin?: boolean;
}

export default function LoginForm({ isAdmin = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  // Define shared input classes for consistency
  const inputBaseClass = "w-full rounded-lg border bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-2";
  const inputBorderClass = "border-gray-700 focus:border-primary focus:ring-primary";
  const inputPaddingClass = "pl-10 pr-3 py-2"; // Padding for icons
  const inputClass = `${inputBaseClass} ${inputBorderClass} ${inputPaddingClass}`;

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session) {
      if (session.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (session.user?.role === 'subscriber') {
        router.push('/profile');
      } else {
        router.push('/');
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
    setError('');
    setLoading(true);
    const toastId = toast.loading('Signing in...');

    try {
      // Validate email
      if (!validateEmail(formData.email)) {
        toast.error('Please enter a valid email address', { id: toastId });
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = result.error === 'CredentialsSignin' 
          ? 'Invalid email or password'
          : result.error;
        setError(errorMessage);
        toast.error(errorMessage, { id: toastId });
        setLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success('Welcome back!', { id: toastId });
        router.push(isAdmin ? '/admin/dashboard' : '/profile');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error('Login failed. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black px-4 py-12">
      <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md border border-primary/20">
        <h1 className="text-2xl font-bold text-white mb-6 text-center font-orbitron">
          {isAdmin ? 'Admin Login' : 'Welcome Back!'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 bg-primary text-dark rounded-lg font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {error && (
          <div className="mt-4 text-center text-red-500 text-sm">
            {error}
          </div>
        )}
        
        {!isAdmin && (
           <p className="mt-6 text-center text-sm text-gray-400 font-rajdhani">
             Don't have an account?{' '}
             <Link href="/register" className="font-medium text-primary hover:text-primary/80">
               Sign up
             </Link>
           </p>
        )}
      </div>
    </div>
  );
} 