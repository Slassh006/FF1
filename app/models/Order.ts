import mongoose, { Schema, Document } from 'mongoose';
import { IStoreItem } from './StoreItem';

export interface IOrderItem {
  item: IStoreItem['_id'];
  quantity: number;
  priceAtPurchase: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'refunded' | 'cancelled';
  paymentDetails: {
    coinBalanceBefore: number;
    coinBalanceAfter: number;
    transactionId: string;
    method: string;
    timestamp: Date;
  };
  metadata: {
    redeemCodes?: string[];
    voucherInfo?: {
      provider: string;
      code: string;
      instructions: string;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    items: [{
      item: {
        type: Schema.Types.ObjectId,
        ref: 'StoreItem',
        required: [true, 'Store item is required'],
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
      },
      priceAtPurchase: {
        type: Number,
        required: [true, 'Price at purchase is required'],
      },
    }],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    paymentDetails: {
      coinBalanceBefore: {
        type: Number,
        required: [true, 'Coin balance before purchase is required'],
      },
      coinBalanceAfter: {
        type: Number,
        required: [true, 'Coin balance after purchase is required'],
      },
      transactionId: {
        type: String,
        required: [true, 'Transaction ID is required'],
      },
      method: {
        type: String,
        required: [true, 'Payment method is required'],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    metadata: {
      redeemCodes: [String],
      voucherInfo: [{
        provider: String,
        code: String,
        instructions: String,
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for efficient querying
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'paymentDetails.transactionId': 1 });

// Virtual for order total items
OrderSchema.virtual('totalItems').get(function(this: IOrder) {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Method to process refund
OrderSchema.methods.processRefund = async function() {
  if (this.status !== 'completed') {
    throw new Error('Only completed orders can be refunded');
  }
  this.status = 'refunded';
  return await this.save();
};

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema); 