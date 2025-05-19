/**
 * Utility functions for generating URLs from GridFS file IDs
 */

/**
 * Generate a URL for a GridFS file
 * @param fileId The GridFS file ID
 * @param type The type of file (image, thumbnail, original)
 * @returns The URL for the file
 */
export function generateGridFsUrl(fileId: string | undefined | null, type: 'image' | 'thumbnail' | 'original' = 'image'): string | null {
  if (!fileId) {
    return null;
  }

  // For internal API routes, use relative path
  return `/api/media/${fileId}?type=${type}`;
}

/**
 * Generate URLs for a MediaAsset object
 * @param mediaAsset The MediaAsset object
 * @returns An object with imageUrl, thumbnailUrl, and originalImageUrl
 */
export function generateMediaAssetUrls(mediaAsset: any): { 
  imageUrl: string | null; 
  thumbnailUrl: string | null; 
  originalImageUrl: string | null;
} {
  if (!mediaAsset) {
    return {
      imageUrl: null,
      thumbnailUrl: null,
      originalImageUrl: null
    };
  }

  // If the mediaAsset already has URLs, use them
  if (mediaAsset.imageUrl || mediaAsset.thumbnailUrl || mediaAsset.originalImageUrl) {
    return {
      imageUrl: mediaAsset.imageUrl || null,
      thumbnailUrl: mediaAsset.thumbnailUrl || null,
      originalImageUrl: mediaAsset.originalImageUrl || null
    };
  }

  // Otherwise, generate URLs from GridFS file IDs
  return {
    // For preview/display, use original for best quality
    imageUrl: generateGridFsUrl(mediaAsset.gridfs_id_original || mediaAsset.gridfs_id_edited || mediaAsset.gridfs_id_compressed, 'image'),
    // For thumbnail, use compressed version
    thumbnailUrl: generateGridFsUrl(mediaAsset.gridfs_id_compressed || mediaAsset.gridfs_id_original, 'thumbnail'),
    // Original is always original
    originalImageUrl: generateGridFsUrl(mediaAsset.gridfs_id_original, 'original')
  };
}

/**
 * Generates a download URL for a wallpaper based on its ID and resolution
 * @param wallpaperId The ID of the wallpaper
 * @param resolution The desired resolution ('desktop', 'mobile', or 'original')
 * @returns The download URL
 */
export const generateDownloadUrl = (wallpaperId: string, resolution: 'desktop' | 'mobile' | 'original'): string => {
  // Use relative URL for API routes
  return `/api/wallpapers/${wallpaperId}/download`;
};

/**
 * Generates a display URL for a wallpaper image
 * @param wallpaper The wallpaper object
 * @returns The display URL
 */
export const generateDisplayUrl = (wallpaper: any): string => {
  if (!wallpaper) return '/images/placeholder.png';
  
  // First try to get URL from mediaAssetId
  if (wallpaper.mediaAssetId) {
    if (typeof wallpaper.mediaAssetId === 'object') {
      // For display/preview, prioritize original for best quality
      if (wallpaper.mediaAssetId.gridfs_id_original) {
        return generateGridFsUrl(wallpaper.mediaAssetId.gridfs_id_original, 'original') || '/images/placeholder.png';
      }
      // If no original, try edited version
      if (wallpaper.mediaAssetId.gridfs_id_edited) {
        return generateGridFsUrl(wallpaper.mediaAssetId.gridfs_id_edited, 'image') || '/images/placeholder.png';
      }
      // Last resort, use compressed version
      if (wallpaper.mediaAssetId.gridfs_id_compressed) {
        return generateGridFsUrl(wallpaper.mediaAssetId.gridfs_id_compressed, 'image') || '/images/placeholder.png';
      }
    }
  }
  
  // Fallback to direct imageUrl if available
  if (wallpaper.imageUrl) {
    return wallpaper.imageUrl;
  }
  
  // Final fallback
  return '/images/placeholder.png';
};

/**
 * Generates a thumbnail URL for a wallpaper
 * @param wallpaper The wallpaper object
 * @returns The thumbnail URL
 */
export const generateThumbnailUrl = (wallpaper: any): string => {
  return wallpaper.mediaAssetId?.thumbnailUrl || wallpaper.thumbnailUrl || '/images/placeholder.png';
}; 