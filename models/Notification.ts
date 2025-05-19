import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'code_verified' | 'code_rejected' | 'vote_received' | 'reward_earned' | 'admin_announcement' | 'security_alert' | 'system';
  title: string;
  message: string;
  reference?: mongoose.Types.ObjectId;
  referenceType?: 'CraftlandCode' | 'Vote' | 'Reward' | 'User' | 'System';
  isRead: boolean;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  readAt?: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['code_verified', 'code_rejected', 'vote_received', 'reward_earned', 'admin_announcement', 'security_alert', 'system']
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 255
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  reference: {
    type: Schema.Types.ObjectId,
    refPath: 'referenceType'
  },
  referenceType: {
    type: String,
    enum: ['CraftlandCode', 'Vote', 'Reward', 'User', 'System']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  readAt: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Indexes for common queries
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, status: 1 });

// Pre-save middleware to set readAt when isRead changes to true
NotificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema); 