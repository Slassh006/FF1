'use client';

import React from 'react';
import Link from 'next/link';
import { FaCheckCircle } from 'react-icons/fa';

const VerificationSuccessPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-dark text-white p-4">
            <div className="bg-secondary shadow-lg rounded-lg p-8 max-w-md w-full text-center">
                <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-6" />
                <h1 className="text-2xl font-bold font-orbitron mb-4">Email Verified!</h1>
                <p className="text-white/80 mb-6">
                    Your email address has been successfully verified. You can now access all features of your account.
                </p>
                <Link href="/login">
                    <button className="w-full px-4 py-2 bg-primary text-dark rounded-md hover:bg-primary/80 transition-colors font-semibold">
                        Proceed to Login
                    </button>
                </Link>
                 <Link href="/">
                    <button className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors font-semibold">
                        Go to Homepage
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default VerificationSuccessPage; 