import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IStoreItem } from './StoreItem';
import { OrderStatus, OrderItem, OrderPaymentDetails, StoreItemType } from '@/app/types/store';

// Define what an item within an order looks like
interface IOrderItem {
  storeItemId: Types.ObjectId; // Reference to the StoreItem
  name: string; // Store name at time of purchase
  category: string; // Store category at time of purchase
  coinCost: number; // Store coin cost at time of purchase
  quantity: number; // Usually 1, but allows for future flexibility
  // Store sensitive details revealed upon purchase completion (optional)
  revealedRedeemCode?: string;
  revealedRewardDetails?: string;
}

const OrderItemSchema: Schema<IOrderItem> = new Schema({
  storeItemId: {
    type: Schema.Types.ObjectId,
    ref: 'StoreItem',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  coinCost: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  revealedRedeemCode: { type: String },
  revealedRewardDetails: { type: String },
}, { _id: false }); // Don't create separate IDs for subdocuments

export interface IOrder extends Document {
  userId: Types.ObjectId; // Reference to the User who placed the order
  items: IOrderItem[]; // Array of items in the order
  totalCoinCost: number; // Total cost calculated at time of order creation
  status: OrderStatus; // Current status of the order
  transactionId?: string; // Optional transaction ID for logging/reference
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for faster user order lookups
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [ (v: IOrderItem[]) => Array.isArray(v) && v.length > 0, 'Order must contain at least one item.'],
    },
    totalCoinCost: {
      type: Number,
      required: true,
      min: [0, 'Total cost cannot be negative.'],
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    transactionId: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: 'orders',
  }
);

// Ensure the userId and status combination is indexed for quick lookups
OrderSchema.index({ userId: 1, status: 1 });

// Check if the model already exists before defining it
const OrderModel: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default OrderModel; 