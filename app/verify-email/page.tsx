'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (token && verificationStatus === 'idle') {
            setVerificationStatus('loading');
            verifyToken(token);
        } else if (!token && verificationStatus === 'idle') {
            setVerificationStatus('error');
            setMessage('Verification token missing. Please check the link in your email.');
        }
    }, [token, verificationStatus]); // Add verificationStatus dependency

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed. Please try again or request a new link.');
            }
            
            setVerificationStatus('success');
            setMessage(data.message || 'Email verified successfully!');

            // Optional: Redirect after a delay
            setTimeout(() => {
                router.push('/login'); // Redirect to login page after success
            }, 4000);

        } catch (error: any) {
            setVerificationStatus('error');
            setMessage(error.message || 'An unexpected error occurred during verification.');
            console.error("Verification API error:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black px-4 py-12">
            <div className="max-w-md w-full space-y-6 bg-secondary p-8 rounded-lg shadow-xl border border-primary/20 text-center">
                
                {verificationStatus === 'loading' && (
                    <>
                        <FaSpinner className="animate-spin text-primary text-4xl mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white">Verifying Email...</h2>
                        <p className="mt-2 text-gray-400">Please wait a moment.</p>
                    </>
                )}

                {verificationStatus === 'success' && (
                    <>
                        <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white">Verification Successful!</h2>
                        <p className="mt-2 text-gray-300">{message}</p>
                        <p className="mt-4 text-sm text-gray-400">You will be redirected to the login page shortly.</p>
                        <Link href="/login" className="mt-6 inline-block px-6 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80 transition-colors">
                            Login Now
                        </Link>
                    </>
                )}

                {verificationStatus === 'error' && (
                    <>
                        <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
                        <p className="mt-2 text-red-400">{message}</p>
                        <p className="mt-4 text-sm text-gray-400">If the problem persists, please contact support or try registering again.</p>
                        {/* Optionally add a button to resend verification */}
                    </>
                )}

                 {verificationStatus === 'idle' && !token && (
                    <>
                        <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white">Missing Token</h2>
                        <p className="mt-2 text-red-400">{message}</p>
                    </>
                )}

            </div>
        </div>
    );
} 