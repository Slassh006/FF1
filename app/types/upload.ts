export type FileType = 'image' | 'video' | 'document' | 'avatar' | 'thumbnail' | 'wallpaper';

export interface UploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  generateThumbnail?: boolean;
  thumbnailConfig?: {
    width: number;
    height: number;
    quality: number;
  };
  cropConfig?: {
    width: number;
    height: number;
    aspectRatio?: number;
  };
  compressConfig?: {
    quality: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}

export interface UploadResult {
  fileId: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface UploadError {
  code: string;
  message: string;
  details?: any;
}

export const DEFAULT_CONFIGS: Record<FileType, UploadConfig> = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    generateThumbnail: true,
    thumbnailConfig: {
      width: 200,
      height: 200,
      quality: 80
    }
  },
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['video/mp4', 'video/webm'],
    generateThumbnail: true,
    thumbnailConfig: {
      width: 320,
      height: 180,
      quality: 80
    }
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    generateThumbnail: true,
    thumbnailConfig: {
      width: 100,
      height: 100,
      quality: 90
    },
    cropConfig: {
      width: 500,
      height: 500,
      aspectRatio: 1
    }
  },
  thumbnail: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    compressConfig: {
      quality: 85,
      maxWidth: 800,
      maxHeight: 800
    }
  },
  wallpaper: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    generateThumbnail: true,
    thumbnailConfig: {
      width: 400,
      height: 400,
      quality: 80
    },
    compressConfig: {
      quality: 90,
      maxWidth: 1920,
      maxHeight: 1920
    }
  }
}; 