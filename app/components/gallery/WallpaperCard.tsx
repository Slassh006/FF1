'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { IWallpaper } from '@/app/lib/types';

interface WallpaperCardProps {
  wallpaper: IWallpaper;
  onClick: (wallpaper: IWallpaper) => void;
}

const WallpaperCard: React.FC<WallpaperCardProps> = ({ wallpaper, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);

  // Debug the wallpaper object on component mount
  useEffect(() => {
    console.log('WallpaperCard mounted with data:', {
      id: wallpaper?._id,
      title: wallpaper?.title,
      hasMediaAssetId: !!wallpaper?.mediaAssetId,
      mediaAssetIdType: wallpaper?.mediaAssetId ? typeof wallpaper.mediaAssetId : 'null',
      mediaAssetIdKeys: wallpaper?.mediaAssetId && typeof wallpaper.mediaAssetId === 'object' 
        ? Object.keys(wallpaper.mediaAssetId) 
        : []
    });
  }, [wallpaper]);

  // Effect to determine the display URL based on wallpaper data
  useEffect(() => {
    setImageLoaded(false); // Reset load status on wallpaper change
    setImageError(false); // Reset error status on wallpaper change
    setDisplayUrl(null);  // Reset display URL

    if (!wallpaper?.mediaAssetId || typeof wallpaper.mediaAssetId !== 'object') {
      console.warn(`[WallpaperCard] No valid mediaAssetId for wallpaper: ${wallpaper?._id}`);
      setImageError(true); // Set error state if no media asset
      return;
    }

    const mediaAsset = wallpaper.mediaAssetId as any;
    const gridfsId = 
      mediaAsset.gridfs_id_compressed || 
      mediaAsset.gridfs_id_edited || 
      mediaAsset.gridfs_id_original;

    if (gridfsId) {
      const url = `/api/media/${gridfsId}?type=image`;
      setDisplayUrl(url);
    } else {
      console.warn(`[WallpaperCard] No valid GridFS ID found in mediaAssetId for wallpaper: ${wallpaper._id}`);
      setImageError(true); // Set error state if no usable ID
    }
  }, [wallpaper]); // Re-run only when wallpaper prop changes

  // Define SVG placeholder (can be moved to a utils file if used elsewhere)
  const svgPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23333333'/><path d='M30 70 l20 -20 l10 10 l20 -20 l10 10 v10 h-60 z' fill='%23666666'/><circle cx='75' cy='35' r='5' fill='%23666666'/></svg>`;

  // --- Image Event Handlers ---
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Prevent infinite loop if placeholder itself fails
    const currentSrc = e.currentTarget.src;
    if (currentSrc === svgPlaceholder) return; 
    
    console.error(`[WallpaperCard] Image load error for: ${displayUrl} (Wallpaper ID: ${wallpaper?._id})`);
    setImageError(true);
    setImageLoaded(false);
    e.currentTarget.src = svgPlaceholder; 
  }, [displayUrl, wallpaper?._id, svgPlaceholder]); // Add svgPlaceholder to dependencies

  // --- Render Logic ---

  // Render placeholder if wallpaper object itself is invalid
  if (!wallpaper || !wallpaper._id) {
    console.warn('[WallpaperCard] Invalid wallpaper object provided');
    return (
      <div className="relative aspect-video group overflow-hidden rounded-lg border border-transparent bg-secondary">
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={svgPlaceholder} // Use SVG placeholder
            alt="Invalid Wallpaper data"
            className="w-16 h-16 opacity-50"
          />
        </div>
      </div>
    );
  }

  // Determine if we should show the actual image or the fallback
  const showImage = displayUrl && !imageError;

  return (
    <div
      className="relative aspect-video group overflow-hidden rounded-lg cursor-pointer border border-transparent hover:border-primary transition-all duration-300 bg-secondary" // Added bg-secondary for consistent background
      onClick={() => {
        console.log(`[WallpaperCard] onClick fired for: ${wallpaper?.title}`);
        onClick(wallpaper);
      }}
      title={wallpaper.title}
    >
      {/* Image or Fallback */} 
      {showImage ? (
        <img
          key={displayUrl} // Add key to force re-render if URL changes
          src={displayUrl}
          alt={wallpaper.title || 'Wallpaper'}
          className={`w-full h-full object-cover transition-opacity duration-300 ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={svgPlaceholder} // Use SVG placeholder
            alt={wallpaper.title || 'Wallpaper Placeholder'}
            className="w-16 h-16 opacity-50"
          />
        </div>
      )}
      
      {/* Loading Indicator (only show if attempting to load the actual image) */}
      {displayUrl && !imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
        <span className="text-white text-sm font-semibold truncate px-2">{wallpaper.title}</span>
        {wallpaper.category && (
          <span className="text-white/70 text-xs truncate px-2 mt-1">{wallpaper.category}</span>
        )}
      </div>
    </div>
  );
};

export default WallpaperCard; 