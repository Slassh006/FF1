import mongoose, { Document, Schema } from 'mongoose';

export interface IRedeemCode extends Document {
  code: string;
  type: 'coins' | 'diamonds' | 'vip';
  amount: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  usedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const redeemCodeSchema = new Schema<IRedeemCode>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  type: {
    type: String,
    enum: ['coins', 'diamonds', 'vip'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  maxUses: {
    type: Number,
    required: true,
    min: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
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
  usedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Add indexes
redeemCodeSchema.index({ type: 1 });
redeemCodeSchema.index({ isActive: 1 });
redeemCodeSchema.index({ expiresAt: 1 });
redeemCodeSchema.index({ createdBy: 1 });

// Define the model
const RedeemCode = mongoose.models?.RedeemCode || mongoose.model<IRedeemCode>('RedeemCode', redeemCodeSchema);

export default RedeemCode; 