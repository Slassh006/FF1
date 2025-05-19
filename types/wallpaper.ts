// types/wallpaper.ts

export interface MediaAsset {
  _id: string;
  gridfs_id_original?: string;
  gridfs_id_edited?: string;
  gridfs_id_compressed?: string;
  filename_original?: string;
  mimeType?: string;
  size_original?: number;
  resolution?: string;
  type?: string;
  tags?: string[];
  uploaderId?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  metadata?: {
    title?: string;
    [key: string]: any;
  };
}

export interface Wallpaper {
  _id: string; // Assuming MongoDB ObjectId as string
  title: string;
  description?: string; // Made optional as it might not always be present
  imageUrl: string;
  thumbnailUrl?: string; // Optional, might be generated
  originalImageUrl?: string; // Optional
  resolution?: string;
  category: 'Free Fire' | 'Characters' | 'Weapons' | 'Elite Pass' | 'Maps' | string; // Keep specific + general string
  tags?: string[];
  downloads?: number;
  likes?: number; // Added from edit form
  viewCount?: number;
  isPublished?: boolean;
  isHD?: boolean;
  isNew?: boolean;
  isTrending?: boolean; // Added from edit form
  contentType?: string; // Added from edit form
  mediaAssetId?: MediaAsset; // Add mediaAssetId property
  // Optional: Add other fields if necessary, e.g., upload date, user ID
  createdAt?: string | Date; // Use string or Date depending on how it's handled
  updatedAt?: string | Date; // Use string or Date
  // If using Mongoose schema timestamps, these might be Date objects initially
  // Add an order field if you persist drag-and-drop order
  order?: number;
} 