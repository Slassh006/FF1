import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: string;
  isPublic: boolean;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'appearance',
      'security',
      'email',
      'social',
      'payment',
      'notification',
      'maintenance',
    ],
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes
settingsSchema.index({ key: 1 });
settingsSchema.index({ category: 1 });
settingsSchema.index({ isPublic: 1 });

// Define the model
const Settings = mongoose.models?.Settings || mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings; 