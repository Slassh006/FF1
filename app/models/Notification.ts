import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'code_verified' | 'code_rejected' | 'vote_received' | 'reward_earned' | 'admin_announcement';
  title: string;
  message: string;
  reference?: mongoose.Types.ObjectId;
  referenceType?: 'CraftlandCode' | 'Vote' | 'Reward';
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
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
    enum: ['code_verified', 'code_rejected', 'vote_received', 'reward_earned', 'admin_announcement'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  reference: {
    type: Schema.Types.ObjectId,
    refPath: 'referenceType'
  },
  referenceType: {
    type: String,
    enum: ['CraftlandCode', 'Vote', 'Reward']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

// Add indexes
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

// Add method to mark notification as read
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// Add static method to create notification
NotificationSchema.statics.createNotification = async function(
  userId: string,
  type: INotification['type'],
  title: string,
  message: string,
  reference?: mongoose.Types.ObjectId,
  referenceType?: INotification['referenceType']
) {
  return this.create({
    userId,
    type,
    title,
    message,
    reference,
    referenceType
  });
};

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);