'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'; // default medium
  className?: string; // Allow passing extra classes
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-8 h-8 border-4',
    large: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`rounded-full border-yellow-500 border-t-transparent animate-spin ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading..."
    >
        <span className="sr-only">Loading...</span> {/* Accessibility */} 
    </div>
  );
};

export default LoadingSpinner; 