'use client';

import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ 
  currentPage,
  totalPages,
  onPageChange 
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Determine pages to show (e.g., show 2 pages before/after current, plus first/last)
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5; // Max buttons like 1 ... 4 5 6 ... 10
    const halfMax = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow + 2) { // Show all if few pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1); // Always show first page
      if (currentPage > halfMax + 2) {
        pages.push('...'); // Ellipsis after first page
      }

      let startPage = Math.max(2, currentPage - halfMax);
      let endPage = Math.min(totalPages - 1, currentPage + halfMax);

      // Adjust window if near start/end
      if (currentPage <= halfMax + 1) {
          endPage = Math.min(totalPages - 1, maxPagesToShow);
      }
      if (currentPage >= totalPages - halfMax) {
          startPage = Math.max(2, totalPages - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - halfMax - 1) {
        pages.push('...'); // Ellipsis before last page
      }
      pages.push(totalPages); // Always show last page
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null; // Don't render pagination if only one page
  }

  return (
    <nav className="flex items-center justify-center space-x-2" aria-label="Pagination">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-md bg-secondary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-white/70 disabled:text-white/40 transition-colors"
        aria-label="Previous page"
      >
        <FaChevronLeft size={14} />
      </button>

      {pageNumbers.map((page, index) => (
        typeof page === 'number' ? (
            <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={currentPage === page}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === page 
                    ? 'bg-primary text-dark cursor-default' 
                    : 'bg-secondary hover:bg-primary/20 text-white/70'}`}
                aria-current={currentPage === page ? 'page' : undefined}
            >
                {page}
            </button>
        ) : (
            <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-sm text-white/50">{page}</span>
        )
      ))}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-md bg-secondary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-white/70 disabled:text-white/40 transition-colors"
        aria-label="Next page"
      >
        <FaChevronRight size={14} />
      </button>
    </nav>
  );
};

export default PaginationControls; 