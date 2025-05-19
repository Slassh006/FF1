'use client';

import React, { PropsWithChildren } from 'react';
import { FaTimes } from 'react-icons/fa';

interface ModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      onClick={onClose} // Close on backdrop click
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-primary/20 transition-transform duration-300 scale-95 animate-modal-scale-in"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-primary/10">
          <h2 id="modal-title" className="text-lg font-semibold text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-primary/10 transition-colors" 
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
      {/* Simple scale-in animation */}
      <style jsx>{`
        @keyframes modal-scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-scale-in {
          animation: modal-scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal; 