'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  isLink?: boolean;
  ariaLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  fullWidth = false,
  icon,
  isLink = false,
  ariaLabel,
}) => {
  const router = useRouter();
  
  // Base classes
  const baseClasses = 'font-orbitron font-bold transition-all duration-300 inline-flex items-center justify-center rounded-md';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary text-secondary hover:bg-opacity-90 hover:animate-glow transform hover:-translate-y-1 disabled:hover:transform-none',
    secondary: 'bg-secondary text-primary border border-primary hover:bg-primary hover:text-secondary transform hover:-translate-y-1 disabled:hover:transform-none',
    outline: 'bg-transparent text-white border border-white hover:border-primary hover:text-primary transform hover:-translate-y-1 disabled:hover:transform-none',
    accent: 'bg-accent text-white hover:bg-opacity-90 transform hover:-translate-y-1 disabled:hover:transform-none',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs py-1 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-3 px-6',
  };
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Disabled class
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`;

  const iconElement = icon ? (
    <span className="mr-2" aria-hidden="true">{icon}</span>
  ) : null;

  const content = (
    <>
      {iconElement}
      <span>{children}</span>
    </>
  );

  // Handle navigation
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (href && !isLink) {
      e.preventDefault();
      router.push(href);
    }

    onClick?.();
  };

  // Common props
  const commonProps = {
    className: buttonClasses,
    'aria-disabled': disabled,
    'aria-label': ariaLabel,
  };

  // If it's a link and href is provided
  if (isLink && href) {
    return (
      <Link 
        href={href}
        {...commonProps}
        onClick={disabled ? (e) => e.preventDefault() : onClick}
        tabIndex={disabled ? -1 : 0}
      >
        {content}
      </Link>
    );
  }

  // Regular button
  return (
    <button
      type={type}
      {...commonProps}
      onClick={handleClick}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {content}
    </button>
  );
};

export default Button; 