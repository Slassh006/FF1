'use client';

import React from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

interface TocSidebarProps {
  headings: TocItem[];
}

const TocSidebar: React.FC<TocSidebarProps> = ({ headings }) => {
  if (!headings || headings.length === 0) {
    return null; // Don't render anything if no headings
  }

  return (
    <nav className="toc-sidebar p-4 bg-secondary border border-primary/20 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-primary mb-3 font-orbitron">INDEX</h3>
      <ol className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}> {/* Indent H3 */} 
            <a 
              href={`#${heading.id}`}
              className="text-sm text-white/80 hover:text-primary transition-colors duration-200 block leading-snug"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
      {/* Optional: Add smooth scroll behavior with CSS in global.css:
          html {
            scroll-behavior: smooth;
            scroll-padding-top: 80px; // Adjust based on your sticky header height
          }
      */}
    </nav>
  );
};

export default TocSidebar; 