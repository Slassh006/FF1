import mongoose, { Schema, Document } from 'mongoose';

export interface IRedeemCode extends Document {
  code: string;
  description: string;
  expiresAt: Date;
  isActive: boolean;
  reward: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedeemCodeSchema = new Schema<IRedeemCode>(
  {
    code: {
      type: String,
      required: [true, 'Please provide a code'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Please provide an expiration date'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    reward: {
      type: String,
      required: [true, 'Please provide a reward description'],
    },
  },
  {
    timestamps: true,
  }
);

// Define the model
let RedeemCode: mongoose.Model<IRedeemCode>;

// Check if the model already exists to prevent recompilation errors
if (mongoose.models && mongoose.models.RedeemCode) {
  RedeemCode = mongoose.models.RedeemCode;
} else {
  RedeemCode = mongoose.model<IRedeemCode>('RedeemCode', RedeemCodeSchema);
}

export default RedeemCode; 