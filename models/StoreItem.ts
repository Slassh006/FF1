import mongoose, { Schema, Document, Model } from 'mongoose';
// import { StoreItemType, StoreItemStatus, StoreItemMetadata } from '@/app/types/store'; // Removed unused imports
import { StoreItemStatus } from '@/app/types/store'; // Keep only needed import

export enum StoreItemCategory {
  REDEEM_CODE = 'Redeem Codes',
  DIGITAL_REWARD = 'Digital Rewards',
}

export interface IStoreItem extends Document {
  name: string;
  description?: string;
  category: StoreItemCategory;
  coinCost: number;
  imageUrl?: string; // For product display (URL)
  imagePath?: string; // For product display (Uploaded file path)
  redeemCode?: string; // Only if category is REDEEM_CODE
  rewardDetails?: string; // Description or voucher info if DIGITAL_REWARD
  inventory?: number | null; // null = infinite, number = limited stock
  isActive: boolean; // To control visibility in the store
  createdAt: Date;
  updatedAt: Date;
}

const StoreItemSchema: Schema<IStoreItem> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Store item name is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(StoreItemCategory),
      required: [true, 'Store item category is required.'],
    },
    coinCost: {
      type: Number,
      required: [true, 'Coin cost is required.'],
      min: [0, 'Coin cost cannot be negative.'],
    },
    imageUrl: {
      type: String,
    },
    imagePath: {
      type: String,
    },
    redeemCode: {
      type: String,
      // Required only if category is REDEEM_CODE - validation handled application-side if needed
    },
    rewardDetails: {
       type: String,
      // Required only if category is DIGITAL_REWARD - validation handled application-side if needed
    },
    inventory: {
      type: Number,
      default: null, // Infinite inventory by default
      min: [0, 'Inventory cannot be negative.'],
    },
    isActive: {
      type: Boolean,
      default: true, // Active by default
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: 'storeitems',
  }
);

// Custom validation logic
StoreItemSchema.pre('validate', function(next) {
  // Check for category-specific requirements
  if (this.category === StoreItemCategory.REDEEM_CODE && !this.redeemCode) {
    this.invalidate('redeemCode', 'Redeem code is required for the selected category.', this.redeemCode);
  }
  if (this.category === StoreItemCategory.DIGITAL_REWARD && !this.rewardDetails) {
    this.invalidate('rewardDetails', 'Reward details are required for the selected category.', this.rewardDetails);
  }

  // Ensure only one image source is provided
  if (this.imageUrl && this.imagePath) {
    this.invalidate('imageUrl', 'Cannot provide both Image URL and Image Path.', this.imageUrl);
    // Optionally, clear one if both are provided, e.g., prefer imagePath:
    // this.imageUrl = undefined;
  }

  // You might want to add validation to ensure *at least one* is provided if image is mandatory
  // if (!this.imageUrl && !this.imagePath) {
  //   this.invalidate('imageUrl', 'An image (URL or upload) is required.');
  // }

  next();
});

// Indexing for faster queries on common fields
StoreItemSchema.index({ isActive: 1, category: 1 });
StoreItemSchema.index({ coinCost: 1 });

// Check if the model already exists before defining it
const StoreItemModel: Model<IStoreItem> = mongoose.models.StoreItem || mongoose.model<IStoreItem>('StoreItem', StoreItemSchema);

export default StoreItemModel; 