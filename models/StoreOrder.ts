import mongoose from 'mongoose';
import { OrderStatus, DeliveryStatus } from '@/app/types/store';

const storeOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  },
  deliveryStatus: {
    type: String,
    enum: Object.values(DeliveryStatus),
    default: DeliveryStatus.PENDING
  },
  metadata: {
    deliveredItem: {
      type: String  // For digital items, this could be the code or reward details
    },
    deliveryDate: Date,
    failureReason: String
  }
}, {
  timestamps: true
});

const StoreOrder = mongoose.models.StoreOrder || mongoose.model('StoreOrder', storeOrderSchema);

export default StoreOrder; 