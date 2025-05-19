import mongoose, { Schema, Document } from 'mongoose';
import { StoreItemType, StoreItemStatus, StoreItemMetadata } from '@/app/types/store';

export interface IStoreItem extends Document {
  name: string;
  description: string;
  price: number;
  type: StoreItemType;
  image: string;
  status: StoreItemStatus;
  inventory: number;
  soldCount: number;
  metadata?: StoreItemMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const StoreItemSchema = new Schema<IStoreItem>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    type: {
      type: String,
      enum: Object.values(StoreItemType),
      required: [true, 'Type is required'],
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    status: {
      type: String,
      enum: Object.values(StoreItemStatus),
      default: StoreItemStatus.DRAFT,
    },
    inventory: {
      type: Number,
      required: [true, 'Inventory count is required'],
      min: [0, 'Inventory cannot be negative'],
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      redeemCode: String,
      voucherInfo: {
        provider: String,
        code: String,
        instructions: String,
      },
      expiryDate: Date,
      redeemCodes: [String],
      badgeIds: [String],
      rewardIds: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Add index for search
StoreItemSchema.index({ name: 'text', description: 'text' });
StoreItemSchema.index({ type: 1, status: 1 });

// Pre-save middleware to validate metadata based on type
StoreItemSchema.pre('save', function(next) {
  if (this.type === StoreItemType.REDEEM_CODE && !this.metadata?.redeemCode) {
    next(new Error('Redeem code is required for redeem code items'));
  }
  if (this.type === StoreItemType.DIGITAL_REWARD && (!this.metadata?.badgeIds?.length && !this.metadata?.rewardIds?.length)) {
    next(new Error('Badge or reward IDs are required for digital reward items'));
  }
  next();
});

const StoreItem = mongoose.models.StoreItem || mongoose.model<IStoreItem>('StoreItem', StoreItemSchema);

export default StoreItem; 