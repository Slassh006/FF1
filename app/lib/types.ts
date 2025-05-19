import { Types } from 'mongoose';

// Updated Blog Interface to match Mongoose Model
export interface Blog {
  _id: string; // Use _id from MongoDB
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: { // Make optional if it can be missing
    url: string;
    alt?: string;
    caption?: string;
  };
  author: { // Assuming author is populated with at least name
    _id: string;
    name?: string; 
  } | string; // Or allow just the ID string if not populated
  category: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived'; // Use enum values
  publishedAt?: string | Date; // Dates might be string after JSON serialization
  featured?: boolean;
  views?: number;
  // Represent likes/comments more simply or use specific types if needed elsewhere
  likes?: any[]; // Simplified for now
  comments?: any[]; // Simplified for now
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
  createdAt: string | Date; // Dates might be string after JSON serialization
  updatedAt: string | Date; // Dates might be string after JSON serialization
  // Add other fields from the model if needed by components consuming this type
  commentCount?: number; // Example virtual
  likeCount?: number; // Example virtual
}

// Define the expected structure of the populated media asset
interface IMediaAssetPopulated {
  _id: string; // Or Types.ObjectId if needed
  imageUrl: string;
  thumbnailUrl?: string;
  // Add other fields from MediaAsset if needed by the gallery
}

export interface IWallpaper {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  // Support both direct URLs and mediaAssetId
  imageUrl?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  mediaAssetId?: {
    imageUrl: string;
    thumbnailUrl: string;
    downloadUrl: string;
  };
  likeCount?: number;
  viewCount: number;
  downloadCount: number;
  downloads?: number;
  isPublished: boolean;
  isHD: boolean;
  isNew: boolean;
  isTrending: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface RedeemCode {
  id: string;
  code: string;
  description: string;
  expiresAt: Date;
  isActive: boolean;
  reward: string;
  maxUses?: number;
  usedCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CraftlandCode {
  id: string;
  title: string;
  description: string;
  code: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  creator: {
    _id: string;
    name: string;
    image?: string;
  };
  createdAt: Date;
  downloadCount: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  features?: string[];
  upvotes: Types.ObjectId[];
  downvotes: Types.ObjectId[];
  likes: Types.ObjectId[];
  isVerified: boolean;
  isFraudulent: boolean;
  region: 'IN' | 'ID' | 'BR' | 'MENA' | 'US' | 'EU' | 'GLOBAL';
  imageUrl?: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITag {
  _id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
} 