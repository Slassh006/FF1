import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaEye, FaShare, FaHeart, FaExpand } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface WallpaperDetailProps {
  title: string;
  imageUrl: string;
  resolution: string;
  downloads: number;
  views: number;
  category: string;
  tags: string[];
  isHD: boolean;
  isNew: boolean;
  onDownload: () => void;
}

export default function WallpaperDetail({
  title,
  imageUrl,
  resolution,
  downloads,
  views,
  category,
  tags,
  isHD,
  isNew,
  onDownload
}: WallpaperDetailProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this awesome ${title} wallpaper!`,
          url: window.location.href,
        });
      } else {
        setShowShareOptions(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  return (
    <div className="relative bg-black/90 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-contain"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Floating Status Badges */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isHD && (
            <span className="bg-primary text-black px-3 py-1 rounded-full font-bold text-sm">
              HD
            </span>
          )}
          {isNew && (
            <span className="bg-accent text-white px-3 py-1 rounded-full font-bold text-sm animate-pulse">
              NEW
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDownload}
            className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
          >
            <FaDownload /> Download Original
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFullscreen(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-full flex items-center gap-2 backdrop-blur-sm"
          >
            <FaExpand /> Preview
          </motion.button>
        </div>
      </div>

      {/* Details Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Title and Stats */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
            <div className="flex flex-wrap gap-6 text-gray-300">
              <div className="flex items-center gap-2">
                <FaDownload className="text-primary" />
                <span>{downloads} Downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEye className="text-primary" />
                <span>{views} Views</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-medium">Resolution:</span>
                <span>{resolution}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="flex justify-end gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={`p-3 rounded-full ${
                isLiked ? 'bg-red-500 text-white' : 'bg-white/10 text-white'
              }`}
            >
              <FaHeart />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="bg-white/10 p-3 rounded-full text-white"
            >
              <FaShare />
            </motion.button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-white/10 text-white px-3 py-1 rounded-full text-sm hover:bg-white/20 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain"
              quality={100}
            />
            <button
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={() => setIsFullscreen(false)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Options Modal */}
      <AnimatePresence>
        {showShareOptions && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 inset-x-0 bg-black/95 p-6 rounded-t-2xl z-40"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Share Wallpaper</h3>
              <button
                onClick={() => setShowShareOptions(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {['Twitter', 'Facebook', 'WhatsApp', 'Copy Link'].map((platform) => (
                <button
                  key={platform}
                  className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-lg text-center"
                  onClick={() => {
                    // Implement sharing logic
                    toast.success(`Sharing via ${platform}`);
                    setShowShareOptions(false);
                  }}
                >
                  {platform}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 