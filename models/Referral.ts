import mongoose, { Schema, Document } from 'mongoose';
import { TransactionType } from '@/lib/transactions';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  referredId: mongoose.Types.ObjectId;
  code: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  rewardAmount: number;
  rewardStatus: 'PENDING' | 'AWARDED' | 'FAILED';
  rewardType: TransactionType;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const ReferralSchema = new Schema({
  referrerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  referredId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'REJECTED'],
    default: 'PENDING'
  },
  rewardAmount: {
    type: Number,
    required: true,
    default: 0
  },
  rewardStatus: {
    type: String,
    enum: ['PENDING', 'AWARDED', 'FAILED'],
    default: 'PENDING'
  },
  rewardType: {
    type: String,
    enum: [
      'REFERRAL_REWARD',
      'REFERRAL_BONUS'
    ],
    required: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for common queries
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ referredId: 1, status: 1 });
ReferralSchema.index({ code: 1, status: 1 });
ReferralSchema.index({ createdAt: -1 });

// Pre-save middleware to validate referral
ReferralSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'COMPLETED') {
    this.completedAt = new Date();
  }
  next();
});

// Static method to get user's referral history
ReferralSchema.statics.getUserReferralHistory = async function(
  userId: string,
  type: 'referrer' | 'referred',
  limit: number = 10,
  skip: number = 0
) {
  const query = type === 'referrer' ? { referrerId: userId } : { referredId: userId };
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate(type === 'referrer' ? 'referredId' : 'referrerId', 'name email avatar')
    .lean();
};

// Static method to get user's referral statistics
ReferralSchema.statics.getUserReferralStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { referrerId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalReward: { $sum: '$rewardAmount' }
      }
    }
  ]);

  return stats;
};

// Static method to check if referral code is valid
ReferralSchema.statics.isValidReferralCode = async function(code: string) {
  const referral = await this.findOne({ code, status: 'PENDING' });
  return !!referral;
};

// Static method to check if user has already been referred
ReferralSchema.statics.hasBeenReferred = async function(userId: string) {
  const referral = await this.findOne({ referredId: userId, status: 'COMPLETED' });
  return !!referral;
};

export default mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema); 