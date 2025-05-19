'use client';

import React from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  fullWidth?: boolean;
  withContainer?: boolean;
  withPadding?: boolean;
}

const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
  id,
  fullWidth = false,
  withContainer = true,
  withPadding = true,
}) => {
  const containerClasses = withContainer ? 'container-custom' : '';
  const paddingClasses = withPadding ? 'py-12 md:py-16' : '';
  
  return (
    <section id={id} className={`${paddingClasses} ${className}`}>
      <div className={`${containerClasses} ${fullWidth ? 'px-0' : ''}`}>
        {(title || subtitle) && (
          <div className="mb-8 text-center">
            {title && (
              <h2 className="mb-2 text-3xl font-bold md:text-4xl heading-title">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="max-w-2xl mx-auto text-base text-white/70 md:text-lg">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export default Section; 