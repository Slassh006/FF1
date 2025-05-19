import mongoose from 'mongoose';

// Define the interface for Newsletter document
interface INewsletter extends mongoose.Document {
  email: string;
  subscribedAt: Date;
  status: 'active' | 'unsubscribed';
  unsubscribedAt?: Date;
  lastEmailSent?: Date;
}

// Define the schema
const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active',
  },
  unsubscribedAt: {
    type: Date,
  },
  lastEmailSent: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Add indexes
newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ status: 1 });

// Define the model
let Newsletter: mongoose.Model<INewsletter>;

try {
  // Check if the model already exists to prevent recompilation errors
  Newsletter = (mongoose.models?.Newsletter || mongoose.model<INewsletter>('Newsletter', newsletterSchema)) as mongoose.Model<INewsletter>;
} catch (error) {
  // If there's an error, try creating the model
  Newsletter = mongoose.model<INewsletter>('Newsletter', newsletterSchema);
}

export default Newsletter; 