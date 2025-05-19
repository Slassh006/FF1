import mongoose, { Schema, Document } from 'mongoose';
import { TransactionType } from '@/lib/transactions';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'REFERRAL_REWARD',
      'REFERRAL_BONUS',
      'CODE_VERIFICATION',
      'HELPFUL_VOTE',
      'QUIZ_REWARD',
      'STORE_PURCHASE',
      'STORE_REFUND',
      'ADMIN_ADJUSTMENT',
      'FRAUD_PENALTY'
    ]
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
    default: 'PENDING'
  },
  reference: {
    type: String,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for common queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ reference: 1 });

// Pre-save middleware to validate amount
TransactionSchema.pre('save', function(next) {
  if (this.isModified('amount') && isNaN(this.amount)) {
    next(new Error('Amount must be a number'));
  }
  next();
});

// Static method to get user's transaction history
TransactionSchema.statics.getUserHistory = async function(
  userId: string,
  limit: number = 10,
  skip: number = 0
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get user's total earnings
TransactionSchema.statics.getUserTotalEarnings = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), amount: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result[0]?.total || 0;
};

// Static method to get user's total spent
TransactionSchema.statics.getUserTotalSpent = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), amount: { $lt: 0 } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return Math.abs(result[0]?.total || 0);
};

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema); 