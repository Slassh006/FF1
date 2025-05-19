import { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaHeart, FaEye, FaBookmark, FaSpinner } from 'react-icons/fa';
import { MdDesktopWindows, MdPhoneAndroid } from 'react-icons/md';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SmartDownloadModal from './SmartDownloadModal';
import { RESOLUTIONS } from '../utils/imageProcessing';

interface WallpaperPreviewModalProps {
  wallpaper: {
    _id: string;
    title: string;
    description?: string;
    imageUrl: string;
    resolution: string;
    downloads: number;
    likes: number;
    viewCount: number;
    category: string;
    tags: string[];
  };
  onClose: () => void;
  onDownloadComplete?: () => void;
}

const MODAL_RESOLUTIONS = {
  desktop: { ...RESOLUTIONS.DESKTOP, icon: MdDesktopWindows },
  mobile: { ...RESOLUTIONS.MOBILE, icon: MdPhoneAndroid },
} as const;

type Resolution = 'desktop' | 'mobile';

export default function WallpaperPreviewModal({ wallpaper, onClose, onDownloadComplete }: WallpaperPreviewModalProps) {
  const [selectedResolution, setSelectedResolution] = useState<Resolution>('desktop');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showSmartDownload, setShowSmartDownload] = useState(false);

  useEffect(() => {
    const img: HTMLImageElement = new window.Image();
    if (wallpaper.imageUrl) {
      img.src = wallpaper.imageUrl;
      img.onload = () => {
        setImageLoading(false);
        setImageError(false);
        setImageSrc(wallpaper.imageUrl);
      };
      img.onerror = () => {
        setImageLoading(false);
        setImageError(true);
      };
    }
  }, [wallpaper.imageUrl]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Like removed' : 'Wallpaper liked');
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Bookmark removed' : 'Wallpaper bookmarked');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-6xl p-4 mx-4 bg-dark rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6">
            {/* Image preview */}
            <div className="relative aspect-[16/9] bg-dark/50 rounded-lg overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaSpinner className="text-4xl text-primary animate-spin" />
                </div>
              )}
              {imageError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
                  <p className="mb-4">Failed to load image</p>
                  <button
                    onClick={() => setImageSrc(wallpaper.imageUrl)}
                    className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                imageSrc && (
                  <div className="relative w-full h-full cursor-pointer group">
                    <img
                      src={imageSrc}
                      alt={wallpaper.title}
                      className="w-full h-full object-contain"
                      onClick={() => setShowSmartDownload(true)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium">Click to open download options</span>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Title and description */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 font-orbitron">{wallpaper.title}</h2>
                {wallpaper.description && (
                  <p className="text-white/70 mb-4 font-rajdhani">{wallpaper.description}</p>
                )}
                <div className="flex items-center space-x-4 text-white/70">
                  <span className="flex items-center">
                    <FaEye className="mr-1" />
                    {wallpaper.viewCount.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <FaDownload className="mr-1" />
                    {wallpaper.downloads.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <FaHeart className="mr-1" />
                    {wallpaper.likes.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Category and tags */}
              <div>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-orbitron">
                  {wallpaper.category}
                </span>
                {wallpaper.tags && wallpaper.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {wallpaper.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-dark/50 text-white/70 rounded-full text-sm font-rajdhani border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolution selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white/90 font-orbitron">Select Resolution</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(MODAL_RESOLUTIONS).map(([key, value]) => {
                    const Icon = value.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedResolution(key as Resolution)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedResolution === key
                            ? 'border-primary bg-primary/20 text-primary'
                            : 'border-gray-600 hover:border-primary/50 text-white/70'
                        }`}
                      >
                        <Icon className="mx-auto mb-2 text-xl" />
                        <div className="text-center">
                          <div className="font-medium font-orbitron">{key === 'desktop' ? 'Desktop' : 'Mobile'}</div>
                          <div className="text-xs text-gray-400 font-rajdhani">{value.width} × {value.height}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleLike}
                  className={`flex-1 py-2 rounded-lg border ${
                    isLiked 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : 'border-gray-600 text-white/70 hover:border-primary/50'
                  } transition-all flex items-center justify-center`}
                >
                  <FaHeart className="mr-2" />
                  <span className="font-rajdhani">{isLiked ? 'Liked' : 'Like'}</span>
                </button>
                <button
                  onClick={handleBookmark}
                  className={`flex-1 py-2 rounded-lg border ${
                    isBookmarked 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : 'border-gray-600 text-white/70 hover:border-primary/50'
                  } transition-all flex items-center justify-center`}
                >
                  <FaBookmark className="mr-2" />
                  <span className="font-rajdhani">{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              {/* Download button */}
              <button
                onClick={() => setShowSmartDownload(true)}
                className="w-full py-3 bg-primary text-dark rounded-lg font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-orbitron"
              >
                <FaDownload />
                <span>Download Wallpaper</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Smart Download Modal */}
      <SmartDownloadModal
        wallpaper={{
          _id: wallpaper._id,
          title: wallpaper.title,
          imageUrl: wallpaper.imageUrl,
          originalUrl: wallpaper.imageUrl,
          mobileUrl: wallpaper.imageUrl
        }}
        isOpen={showSmartDownload}
        onClose={() => setShowSmartDownload(false)}
        onDownloadComplete={onDownloadComplete}
      />
    </AnimatePresence>
  );
} 