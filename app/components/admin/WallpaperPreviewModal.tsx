'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaDownload, FaStar, FaEye, FaImage, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface MediaAsset {
  _id: string;
  gridfs_id_original?: string;
  gridfs_id_edited?: string;
  gridfs_id_compressed?: string;
}

interface Wallpaper {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  originalImageUrl: string;
  resolution: string;
  category: string;
  tags: string[];
  downloads: number;
  viewCount: number;
  isPublished: boolean;
  isHD: boolean;
  isNew: boolean;
  mediaAssetId?: MediaAsset;
}

interface WallpaperPreviewModalProps {
  wallpaper: Wallpaper;
  onClose: () => void;
}

const WallpaperPreviewModal: React.FC<WallpaperPreviewModalProps> = ({ wallpaper, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get the appropriate image URL based on available sources
  const getImageUrl = () => {
    if (wallpaper?.mediaAssetId?.gridfs_id_original) {
      return `/api/media/${wallpaper.mediaAssetId.gridfs_id_original}?type=image`;
    }
    if (wallpaper?.mediaAssetId?.gridfs_id_edited) {
      return `/api/media/${wallpaper.mediaAssetId.gridfs_id_edited}?type=image`;
    }
    return wallpaper.imageUrl || wallpaper.originalImageUrl;
  };

  const handleDownload = async () => {
    try {
      // Track download
      await fetch(`/api/wallpapers/${wallpaper._id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: 'original' }),
      });

      // Get download URL
      const downloadUrl = getImageUrl();
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${wallpaper.title || 'wallpaper'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download wallpaper');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
      <div className="bg-dark rounded-lg shadow-xl p-6 max-w-4xl w-full relative max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl z-10 p-1 bg-dark/50 rounded-full"
          aria-label="Close preview"
        >
          <FaTimes />
        </button>
        
        <h2 className="text-xl font-semibold text-white mb-4 font-orbitron truncate">
          {wallpaper.title || 'Wallpaper Preview'}
        </h2>
        
        {/* Image Preview Container */}
        <div className="flex-grow overflow-hidden flex justify-center items-center bg-black/20 rounded-lg mb-4 min-h-[300px] relative">
          {getImageUrl() ? (
            <div className="relative w-full h-full min-h-[300px]">
              <Image 
                src={getImageUrl()}
                alt={wallpaper.title || 'Wallpaper preview'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                priority
                onLoadingComplete={() => setLoading(false)}
                onError={() => {
                  setError(true);
                  setLoading(false);
                }}
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark/50">
                  <FaSpinner className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark/50">
                  <div className="text-center text-gray-400">
                    <FaImage className="w-12 h-12 mx-auto mb-2" />
                    <p>Failed to load image</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <FaImage className="w-16 h-16 mx-auto mb-2" />
              <p>Image not available</p>
            </div>
          )}
        </div>
        
        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div className="space-y-2">
            {wallpaper.description && (
              <p className="text-white/80">{wallpaper.description}</p>
            )}
            {wallpaper.tags && wallpaper.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {wallpaper.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Resolution:</span>
              <span className="text-white font-medium font-orbitron">{wallpaper.resolution || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Downloads:</span>
              <span className="text-white font-medium">{wallpaper.downloads.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Views:</span>
              <span className="text-white font-medium">{wallpaper.viewCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Category:</span>
              <span className="text-white font-medium">{wallpaper.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Status:</span>
              <div className="flex gap-2">
                {wallpaper.isPublished && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Published</span>
                )}
                {wallpaper.isHD && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">HD</span>
                )}
                {wallpaper.isNew && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">New</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        {getImageUrl() && (
          <button
            onClick={handleDownload}
            className="mt-4 w-full md:w-auto md:ml-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-dark font-medium rounded-lg hover:bg-primary/80 transition-colors"
          >
            <FaDownload /> Download Original
          </button>
        )}
      </div>
    </div>
  );
};

export default WallpaperPreviewModal; 