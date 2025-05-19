import mongoose, { Document, Schema } from 'mongoose';

export interface ICraftlandMap extends Document {
  name: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  size: number;
  version: string;
  author: string;
  category: mongoose.Types.ObjectId;
  tags: string[];
  downloads: number;
  likes: number;
  isFeatured: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const craftlandMapSchema = new Schema<ICraftlandMap>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  downloadUrl: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
    min: 0,
  },
  version: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  downloads: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes
craftlandMapSchema.index({ name: 'text', description: 'text' });
craftlandMapSchema.index({ category: 1 });
craftlandMapSchema.index({ tags: 1 });
craftlandMapSchema.index({ isFeatured: 1 });
craftlandMapSchema.index({ isActive: 1 });
craftlandMapSchema.index({ createdBy: 1 });

// Define the model
const CraftlandMap = mongoose.models?.CraftlandMap || mongoose.model<ICraftlandMap>('CraftlandMap', craftlandMapSchema);

export default CraftlandMap; 