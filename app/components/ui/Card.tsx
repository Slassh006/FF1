'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface CardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  href?: string;
  className?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  imageAlt?: string;
  badges?: string[];
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  title,
  description,
  imageUrl,
  href,
  className = '',
  footer,
  children,
  imageAlt = '',
  badges = [],
  onClick,
}) => {
  const router = useRouter();
  const titleId = `card-title-${title.toLowerCase().replace(/\s+/g, '-')}`;
  
  const cardClasses = `bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:shadow-xl ${
    (href || onClick) ? 'cursor-pointer hover:-translate-y-1' : ''
  } ${className}`;

  const handleClick = (e: React.MouseEvent) => {
    if (href) {
      e.preventDefault();
      router.push(href);
    }
    onClick?.();
  };

  const cardContent = (
    <>
      {/* Card Image */}
      {imageUrl && (
        <div className="relative w-full h-48 mb-4 overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="lazy"
          />
          
          {/* Badges */}
          {badges.length > 0 && (
            <div 
              className="absolute top-2 left-2 flex flex-wrap gap-1" 
              aria-label="Badges"
              role="group"
            >
              {badges.map((badge, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 text-xs font-bold bg-primary/80 text-secondary rounded-md backdrop-blur-sm"
                  role="status"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Card Body */}
      <div className="p-4">
        <h3 
          id={titleId}
          className="mb-2 text-xl font-bold text-white font-orbitron"
        >
          {title}
        </h3>
        {description && (
          <p className="mb-4 text-sm text-white/70 font-rajdhani">
            {description}
          </p>
        )}
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className="p-4 pt-0" role="contentinfo">
          {footer}
        </div>
      )}
    </>
  );

  // Common props
  const commonProps = {
    className: `group ${cardClasses}`,
    role: 'article',
    'aria-labelledby': titleId,
  };

  // If href is provided, wrap in Link
  if (href) {
    return (
      <Link 
        href={href}
        {...commonProps}
        onClick={onClick}
        tabIndex={0}
      >
        {cardContent}
      </Link>
    );
  }

  // If onClick is provided, wrap in button
  if (onClick) {
    return (
      <button 
        onClick={handleClick}
        type="button"
        {...commonProps}
        tabIndex={0}
      >
        {cardContent}
      </button>
    );
  }

  // Otherwise, render as a div
  return (
    <div {...commonProps}>
      {cardContent}
    </div>
  );
};

export default Card; 