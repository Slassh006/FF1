'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FaTimesCircle } from 'react-icons/fa';

const VerificationFailedContent = () => {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    let title = "Verification Failed";
    let message = "An unexpected error occurred. Please try again later or contact support.";

    switch (error) {
        case 'missing_token':
            message = "The verification link is incomplete. Please ensure you copied the full link.";
            break;
        case 'invalid_token':
            message = "This verification link is invalid or has expired. You may need to request a new verification email.";
            break;
        case 'server_error':
            message = "We couldn't process your verification due to a server issue. Please try again shortly.";
            break;
        // Add more specific error cases if needed
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-dark text-white p-4">
            <div className="bg-secondary shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-6" />
                <h1 className="text-2xl font-bold font-orbitron mb-4">{title}</h1>
                <p className="text-white/80 mb-6">
                    {message}
                </p>
                {/* Optional: Add a button to resend verification email if applicable */}
                {/* <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors font-semibold mb-4">Resend Verification Email</button> */}
                <Link href="/">
                    <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors font-semibold">
                        Go to Homepage
                    </button>
                </Link>
            </div>
        </div>
    );
};

// Wrap with Suspense because useSearchParams needs it during SSR/static generation
const VerificationFailedPage = () => {
    return (
        <Suspense fallback={<div className='min-h-screen flex items-center justify-center bg-dark text-white'>Loading...</div>}>
            <VerificationFailedContent />
        </Suspense>
    );
}

export default VerificationFailedPage; 