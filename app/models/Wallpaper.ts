import mongoose, { Schema, Document, Types, Model, SchemaDefinitionProperty } from 'mongoose';
import { generateMediaAssetUrls } from '@/app/lib/urlUtils';

export interface IWallpaper extends Document {
  title: string;
  description: string;
  resolution: string;
  category: 'Free Fire' | 'Characters' | 'Weapons' | 'Elite Pass' | 'Maps';
  tags: string[];
  downloads: number;
  viewCount: number;
  isPublished: boolean;
  isHD: boolean;
  isNew: boolean;
  isTrending: boolean;
  uploadedBy: Types.ObjectId;
  mediaAssetId: Types.ObjectId;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  imageUrl?: string;
  thumbnailUrl?: string;
  originalImageUrl?: string;
  
  // Methods
  incrementDownloads(): Promise<this>;
  incrementViews(): Promise<this>;
}

type WallpaperSchemaType = {
  [K in keyof Omit<IWallpaper, 'imageUrl' | 'thumbnailUrl' | 'originalImageUrl' | 'contentType'>]: SchemaDefinitionProperty<IWallpaper[K]>;
};

const wallpaperSchema = new Schema<IWallpaper>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  resolution: {
    type: String,
    required: [true, 'Resolution is required'],
    default: '1920x1080'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Free Fire', 'Characters', 'Weapons', 'Elite Pass', 'Maps'],
      message: '{VALUE} is not a valid category'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  downloads: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isHD: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: true
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  mediaAssetId: {
    type: Schema.Types.ObjectId,
    ref: 'MediaAsset',
    required: [true, 'Media Asset reference is required'],
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
} as unknown as WallpaperSchemaType, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  suppressReservedKeysWarning: true
});

// Add virtual properties for image URLs
wallpaperSchema.virtual('imageUrl').get(function(this: IWallpaper) {
  // If mediaAssetId is populated, use its imageUrl
  if (this.mediaAssetId && typeof this.mediaAssetId === 'object') {
    const urls = generateMediaAssetUrls(this.mediaAssetId as any);
    return urls.imageUrl;
  }
  // Otherwise, return null
  return null;
});

wallpaperSchema.virtual('thumbnailUrl').get(function(this: IWallpaper) {
  // If mediaAssetId is populated, use its thumbnailUrl
  if (this.mediaAssetId && typeof this.mediaAssetId === 'object') {
    const urls = generateMediaAssetUrls(this.mediaAssetId as any);
    return urls.thumbnailUrl;
  }
  // Otherwise, return null
  return null;
});

wallpaperSchema.virtual('originalImageUrl').get(function(this: IWallpaper) {
  // If mediaAssetId is populated, use its originalImageUrl
  if (this.mediaAssetId && typeof this.mediaAssetId === 'object') {
    const urls = generateMediaAssetUrls(this.mediaAssetId as any);
    return urls.originalImageUrl;
  }
  // Otherwise, return null
  return null;
});

// Indexes
wallpaperSchema.index({ title: 'text', description: 'text', tags: 'text' });
wallpaperSchema.index({ category: 1 });
wallpaperSchema.index({ isPublished: 1 });
wallpaperSchema.index({ isHD: 1 });
wallpaperSchema.index({ isNew: 1 });
wallpaperSchema.index({ isTrending: 1 });
wallpaperSchema.index({ createdAt: -1 });
wallpaperSchema.index({ viewCount: -1 });
wallpaperSchema.index({ downloads: -1 });
wallpaperSchema.index({ uploadedBy: 1 });

// Methods
wallpaperSchema.methods.incrementDownloads = async function(this: IWallpaper) {
  this.downloads += 1;
  return this.save();
};

wallpaperSchema.methods.incrementViews = async function(this: IWallpaper) {
  this.viewCount += 1;
  return this.save();
};

// Pre-save middleware to update the updatedAt field
wallpaperSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export the model
const Wallpaper = mongoose.models.Wallpaper || mongoose.model<IWallpaper>('Wallpaper', wallpaperSchema);
export default Wallpaper; 