import mongoose from 'mongoose';

export interface IActivity {
  userId: mongoose.Types.ObjectId;
  type: string;
  action: string;
  timestamp: Date;
  details?: Record<string, any>;
}

const activitySchema = new mongoose.Schema<IActivity>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['post', 'wallpaper', 'redeem', 'craftland', 'user', 'store', 'comment', 'quiz']
  },
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  }
});

// Create indexes for better query performance
activitySchema.index({ timestamp: -1 });
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });

const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', activitySchema);

export default Activity; 