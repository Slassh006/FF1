import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  paymentDetails: {
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    upiId?: string;
    walletAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentDetails: {
      accountNumber: String,
      accountName: String,
      bankName: String,
      upiId: String,
      walletAddress: String,
    },
    processedAt: Date,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Add indexes
WithdrawalSchema.index({ userId: 1, status: 1 });
WithdrawalSchema.index({ status: 1, createdAt: 1 });

export const Withdrawal = mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema); 