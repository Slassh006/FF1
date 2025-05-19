import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
// Keep IWallpaper if defined in your project, otherwise remove/adjust
// import { IWallpaper } from '@/app/lib/types'; 
import { FaTimes, FaDownload, FaSpinner, FaDesktop, FaMobileAlt, FaExclamationTriangle } from 'react-icons/fa'; // Added ExclamationTriangle

// Use the prop structure you established previously
interface SmartDownloadModalProps {
  wallpaper: {
    _id: string;
    title?: string;
    imageUrl: string; // Used for preview & potentially cropping
    originalUrl: string; // Used for desktop download
    mobileUrl?: string; // Potentially used if direct mobile URL exists, otherwise cropped
  };
  onClose: () => void;
  isOpen: boolean;
  onDownloadComplete?: () => void;
}

// Define constants for mobile cropping dimensions
const MOBILE_TARGET_WIDTH = 1080;
const MOBILE_TARGET_HEIGHT = 1920;

// Define valid resolutions for download
const VALID_RESOLUTIONS = ['desktop', 'mobile', 'original'] as const;
type Resolution = typeof VALID_RESOLUTIONS[number];

const SmartDownloadModal: React.FC<SmartDownloadModalProps> = ({ wallpaper, onClose, isOpen, onDownloadComplete }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDownloadingDesktop, setIsDownloadingDesktop] = useState(false);
  const [isDownloadingMobile, setIsDownloadingMobile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hooks must be called unconditionally at the top level.
  // Callbacks and Effects are hooks.
  const handleDownload = useCallback(async (resolution: Resolution) => {
    if (isDownloading) return;
    setIsDownloading(true);
    setErrorMessage(null);
    const toastId = toast.loading('Preparing download...');

    try {
      const response = await fetch(`/api/wallpapers/${wallpaper._id}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolution }),
      });

      if (!response.ok) {
        let errorMsg = 'Download failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMsg = response.statusText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition');
      let filename = `${wallpaper.title || 'wallpaper'}-${resolution}.jpg`; // Default filename
      if (disposition && disposition.includes('filename=')) {
        const filenameMatch = disposition.match(/filename=["']?([^"']+)["']?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started!', { id: toastId });
      onClose(); // Close modal on successful download start
    } catch (err: any) {
      console.error('Download error:', err);
      const errorMessage = err.message || 'An error occurred during download';
      setErrorMessage(errorMessage);
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  }, [wallpaper, onClose, isDownloading]);

  const copyLink = useCallback((resolution: Resolution) => {
    if (!wallpaper?._id) return;
    // Generate a direct link (assuming /api/files can serve based on MediaAsset IDs)
    // This requires knowing which file ID corresponds to which resolution
    // Let's assume a simplified structure for now, or link to the wallpaper page
    // const directLink = `${window.location.origin}/api/files/...`; // Need logic to get correct fileId
    const wallpaperPageLink = `${window.location.origin}/wallpapers/${wallpaper._id}`;
    navigator.clipboard.writeText(wallpaperPageLink)
      .then(() => toast.success(`${resolution} link copied (to page)`))
      .catch(() => toast.error('Failed to copy link'));
  }, [wallpaper]);

  useEffect(() => {
    // Effect for handling Escape key to close modal
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    // Reset error message when modal opens
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // Log wallpaper details when modal opens for debugging
    if (isOpen && wallpaper) {
      console.log('SmartDownloadModal opened with wallpaper:', wallpaper);
    }
  }, [isOpen, wallpaper]);
  
  // >>> Moved the early return AFTER all hook calls <<<
  if (!isOpen || !wallpaper) {
    return null;
  }

  // --- Helper: Trigger Download ---
  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url); // Clean up blob URLs if used
  };

  // --- Desktop Download Handler ---
  const handleDesktopDownload = useCallback(async () => {
    if (isDownloadingDesktop || isDownloadingMobile) return;
    setIsDownloadingDesktop(true);
    try {
      // Use the originalUrl for desktop download
      const response = await fetch(wallpaper.originalUrl); 
      if (!response.ok) throw new Error('Desktop download failed');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const filename = `${wallpaper.title || 'wallpaper'}_desktop_original.jpg`; // Or use actual dimensions if known
      triggerDownload(blobUrl, filename);
      
      toast.success('Desktop download started!');
      onDownloadComplete?.(); // Call callback if provided
    } catch (error) {
      console.error('Desktop download error:', error);
      toast.error('Failed to download desktop version.');
    } finally {
      setIsDownloadingDesktop(false);
    }
  }, [isDownloadingDesktop, isDownloadingMobile, wallpaper.originalUrl, wallpaper.title, onDownloadComplete]);

  // --- Mobile Download Handler (with Cropping) ---
  const handleMobileDownload = useCallback(() => {
    if (isDownloadingMobile || isDownloadingDesktop) return;
    setIsDownloadingMobile(true);
    const toastId = toast.loading('Preparing mobile download...');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = wallpaper.imageUrl; 

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Failed to create canvas context', { id: toastId });
        setIsDownloadingMobile(false);
        return;
      }

      // Set canvas dimensions to target mobile size
      const targetWidth = MOBILE_TARGET_WIDTH;
      const targetHeight = MOBILE_TARGET_HEIGHT;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Calculate scaling to maintain aspect ratio
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the image
      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;

      // Draw image with black background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      try {
        const dataUrl = canvas.toDataURL('image/png'); 
        const filename = `${wallpaper.title || 'wallpaper'}_mobile_${targetWidth}x${targetHeight}.png`;
        triggerDownload(dataUrl, filename);
        toast.success('Mobile download started!', { id: toastId });
        onDownloadComplete?.();
      } catch (error) {
        console.error('Canvas toDataURL error:', error);
        toast.error('Failed to generate mobile wallpaper. The image might be protected.', { id: toastId });
      } finally {
        setIsDownloadingMobile(false);
      }
    };

    img.onerror = (error) => {
      console.error('Mobile image loading error:', error);
      toast.error('Failed to load image for mobile version. Please try again.', { id: toastId });
      setIsDownloadingMobile(false);
    };
  }, [isDownloadingMobile, isDownloadingDesktop, wallpaper.imageUrl, wallpaper.title, onDownloadComplete]);

  // --- Effects ---
  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Image preloading for preview
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    let isCancelled = false; // Flag to prevent state update if component unmounts
    
    const img = new Image();
    img.src = wallpaper.imageUrl; 
    
    img.onload = () => {
      if (!isCancelled) {
        setImageLoaded(true);
      }
    };
    img.onerror = () => {
      if (!isCancelled) {
        console.error("Error loading preview image:", wallpaper.imageUrl);
        setImageError(true);
      }
    };

    // Cleanup function
    return () => {
      isCancelled = true;
      // Although modern browsers might garbage collect, explicitly removing listeners is good practice
      img.onload = null; 
      img.onerror = null;
      // Setting src to empty might help some browsers release resources faster, but often not necessary
      // img.src = ''; 
    };
  }, [wallpaper.imageUrl]);

  // --- Render Logic ---
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose} 
    >
      <div 
        className="bg-secondary rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-transform duration-300 scale-95 opacity-0 animate-fade-scale-in"
        style={{ animationFillMode: 'forwards' }} // Keep final state of animation
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Modal Header */} 
        <div className="flex justify-between items-center p-3 md:p-4 border-b border-primary/10 flex-shrink-0">
          <h2 className="text-lg md:text-xl font-semibold text-white font-orbitron truncate pr-4">
            {wallpaper.title || 'Wallpaper Details'}
          </h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Modal Body (Image Preview Area) - Use flex-grow and min-h-0 */}
        <div className="relative flex-grow flex items-center justify-center overflow-hidden bg-black min-h-0"> 
          {/* Loading State */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
              <FaSpinner className="animate-spin text-primary text-5xl opacity-80" />
            </div>
          )}

          {/* Error State */}
          {imageError && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400/90 px-6 text-center z-10 bg-black/70">
              <FaExclamationTriangle size={40} className="mb-4 opacity-70"/> 
              <p className="text-lg font-medium">Could not load preview</p>
              <p className="text-sm text-white/60 mt-1">The image might be unavailable or invalid.</p>
            </div>
          )}

          {/* Image - Show only if loaded and no error */} 
          {imageLoaded && !imageError && (
            <img 
              src={wallpaper.imageUrl} 
              alt={wallpaper.title || 'Wallpaper Preview'}
              // Add animation class here
              className={`block w-auto h-auto max-w-full max-h-full object-contain transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} animate-ken-burns`}
            />
          )}

          {/* Download Options Overlay - Only show if image loaded */}
          {imageLoaded && !imageError && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md p-4 flex justify-center items-center gap-8 md:gap-12 text-white z-20">
              {/* Base button class */}
              {(() => {
                const buttonBaseClass = "flex items-center gap-2.5 cursor-pointer transition-all duration-200 text-sm md:text-base bg-transparent border-none p-1 rounded disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black/50";
                const buttonHoverClass = "hover:text-primary hover:scale-105";
                const disabledState = isDownloadingDesktop || isDownloadingMobile;
                
                return (
                  <>
                    {/* Desktop Download Button */}
                    <button 
                      onClick={handleDesktopDownload}
                      disabled={disabledState}
                      className={`${buttonBaseClass} ${!disabledState ? buttonHoverClass : ''}`}
                      aria-label="Download Desktop Wallpaper"
                    >
                      {isDownloadingDesktop ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaDesktop size={18} />
                      )}
                      <span className="font-medium">Desktop</span> 
                      <span className="text-xs text-white/70">(Original)</span> 
                      {!isDownloadingDesktop && <FaDownload size={14} className="opacity-70 ml-1" />}
                    </button>

                    {/* Mobile Download Button */}
                    <button 
                      onClick={handleMobileDownload}
                      disabled={disabledState}
                      className={`${buttonBaseClass} ${!disabledState ? buttonHoverClass : ''}`}
                      aria-label="Download Mobile Wallpaper"
                    >
                      {isDownloadingMobile ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaMobileAlt size={18} />
                      )}
                      <span className="font-medium">Mobile</span> 
                      <span className="text-xs text-white/70">(1080x1920)</span> 
                      {!isDownloadingMobile && <FaDownload size={14} className="opacity-70 ml-1" />}
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div> 
        {/* End Modal Body */}
      </div> 
      {/* End Modal Content Container */} 
      
      {/* Add keyframes for animation */}
      <style jsx global>{`
        @keyframes fade-scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-scale-in {
          animation: fade-scale-in 0.3s ease-out;
        }

        /* Ken Burns Effect Keyframes */
        @keyframes ken-burns {
          0% {
            transform: scale(1) translate(0, 0);
            transform-origin: center center;
          }
          100% {
            /* Adjust scale and translate values for desired effect speed/intensity */
            transform: scale(1.08) translate(-1%, 1%); 
            transform-origin: center center;
          }
        }
        .animate-ken-burns {
          /* Adjust duration (e.g., 20s), timing, direction, count */
          animation: ken-burns 25s ease-in-out infinite alternate;
        }
      `}</style>
    </div> 
  );
};

export default SmartDownloadModal; 