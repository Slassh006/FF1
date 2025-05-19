import mongoose, { Schema, Document, Model } from 'mongoose';
import { INotification } from './Notification';

export interface ICraftlandCode extends Document {
  title: string;
  code: string;
  description?: string;
  category?: string;
  region?: string;
  difficulty?: string;
  status?: 'pending' | 'approved' | 'rejected';
  author?: string;
  isVerified?: boolean;
  isActive?: boolean;
  videoUrl?: string;
  tags?: string[];
  features?: string[];
  coverImage?: string;
  creator: mongoose.Types.ObjectId;
  createdAt: Date;
  downloadCount: number;
  coverImageId?: string;
  submittedBy?: mongoose.Types.ObjectId;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  likes: mongoose.Types.ObjectId[];
  checkFraud(userId: string): Promise<boolean>;
  castVote(userId: string, vote: 'up' | 'down'): Promise<{ isNowVerified: boolean; verificationStateChanged: boolean; netVotes: number }>;
  toggleLike(userId: string): Promise<boolean>;
  checkAutoVerification(): Promise<boolean>;
  netVotes: number;
  lastVoteTime: Date | null;
  isFraudulent: boolean;
  reports: {
    userId: mongoose.Types.ObjectId;
    reason: string;
    category: 'spam' | 'inappropriate' | 'broken' | 'duplicate' | 'other';
    details?: string;
    createdAt: Date;
    status: 'pending' | 'resolved' | 'dismissed';
  }[];
  reportCount: number;
  lastReportedAt?: Date;
  lastModifiedBy?: mongoose.Types.ObjectId;
  lastModifiedAt?: Date;
}

const VOTE_THRESHOLD = 10; // Number of positive votes needed for auto-verification
const VOTE_COOLDOWN = 5 * 60 * 1000; // 5 minutes
const FRAUD_THRESHOLD = 5; // Number of downvotes to trigger fraud check
const SUBMISSION_COOLDOWN = 60 * 60 * 1000; // 1 hour cooldown between submissions

const CraftlandCodeSchema = new Schema<ICraftlandCode>({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: String,
  category: String,
  region: String,
  difficulty: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  author: String,
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  videoUrl: String,
  tags: [String],
  features: [String],
  coverImage: String,
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  coverImageId: String,
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  upvotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  netVotes: {
    type: Number,
    default: 0
  },
  lastVoteTime: {
    type: Date,
    default: null
  },
  isFraudulent: {
    type: Boolean,
    default: false
  },
  reports: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    category: { 
      type: String, 
      enum: ['spam', 'inappropriate', 'broken', 'duplicate', 'other'],
      required: true 
    },
    details: String,
    createdAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  reportCount: { 
    type: Number, 
    default: 0 
  },
  lastReportedAt: Date,
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedAt: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Check for fraudulent activity
CraftlandCodeSchema.methods.checkFraud = async function(userId: string) {
  const now = Date.now();
  
  // Check for rapid submissions
  const CraftlandCodeModel = mongoose.model('CraftlandCode') as unknown as Model<ICraftlandCode>;
  const recentSubmissions = await CraftlandCodeModel.find({
    submittedBy: userId,
    createdAt: { $gte: new Date(now - SUBMISSION_COOLDOWN) }
  }).countDocuments();

  if (recentSubmissions > 3) {
    return true; // Too many submissions in short time
  }

  // Check vote patterns
  const downvoteRatio = this.downvotes.length / (this.upvotes.length + this.downvotes.length);
  if (downvoteRatio > 0.7) { // More than 70% downvotes
    return true;
  }

  // Check for suspicious vote patterns
  const suspiciousVotes = await CraftlandCodeModel.find({
    $or: [
      { upvotes: userId },
      { downvotes: userId }
    ],
    createdAt: { $gte: new Date(now - VOTE_COOLDOWN) }
  }).countDocuments();

  if (suspiciousVotes > 10) { // Too many votes in short time
    return true;
  }

  return false;
};

// Add method to handle fraud detection
CraftlandCodeSchema.methods.handleFraudDetection = async function() {
  if (this.downvotes.length >= FRAUD_THRESHOLD) {
    this.isFraudulent = true;
    this.status = 'rejected';
    await this.save();

    // Notify the user who submitted the code
    if (this.submittedBy) {
      const NotificationModel = mongoose.model('Notification') as unknown as Model<INotification>;
      await NotificationModel.create({
        userId: this.submittedBy,
        type: 'code_rejected',
        title: 'Code Rejected',
        message: `Your code "${this.title}" has been marked as fraudulent due to multiple downvotes.`,
        reference: this._id,
        referenceType: 'CraftlandCode'
      });
    }
  }
};

// Add method to check if code should be auto-verified
CraftlandCodeSchema.methods.checkAutoVerification = async function() {
  const netVotes = this.upvotes.length - this.downvotes.length;
  if (netVotes >= VOTE_THRESHOLD && !this.isVerified) {
    this.isVerified = true;
    this.status = 'approved';
    await this.save();
    return true;
  }
  return false;
};

// Update castVote method to include fraud detection
CraftlandCodeSchema.methods.castVote = async function(userId: string, vote: 'up' | 'down') {
  const now = Date.now();
  
  // Check vote cooldown
  if (this.lastVoteTime && (now - this.lastVoteTime.getTime()) < VOTE_COOLDOWN) {
    throw new Error('Please wait before voting again');
  }

  // Check for fraud
  const isFraudulent = await this.checkFraud(userId);
  if (isFraudulent) {
    throw new Error('Suspicious activity detected. Please contact support.');
  }

  // Remove existing vote if any
  this.upvotes = this.upvotes.filter((id: mongoose.Types.ObjectId) => id.toString() !== userId);
  this.downvotes = this.downvotes.filter((id: mongoose.Types.ObjectId) => id.toString() !== userId);

  // Add new vote
  if (vote === 'up') {
    this.upvotes.push(userId);
  } else {
    this.downvotes.push(userId);
  }

  // Update net votes
  this.netVotes = this.upvotes.length - this.downvotes.length;
  this.lastVoteTime = new Date();

  // Check for auto-verification
  const isNowVerified = await this.checkAutoVerification();

  // Check for fraud
  await this.handleFraudDetection();

  await this.save();

  return {
    isNowVerified,
    verificationStateChanged: isNowVerified,
    netVotes: this.netVotes
  };
};

// Toggle like status
CraftlandCodeSchema.methods.toggleLike = async function(userId: string): Promise<boolean> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const index = this.likes.findIndex((id: mongoose.Types.ObjectId) => id.equals(userObjectId));
  
  if (index === -1) {
    this.likes.push(userObjectId);
  } else {
    this.likes.splice(index, 1);
  }
  
  await this.save();
  return index === -1; // Return true if liked, false if unliked
};

// Add method to handle reports
CraftlandCodeSchema.methods.addReport = async function(userId: string, reportData: {
  reason: string;
  category: 'spam' | 'inappropriate' | 'broken' | 'duplicate' | 'other';
  details?: string;
}) {
  // Check if user has already reported this code
  const existingReport = this.reports.find((report: { userId: { toString: () => string }; status: string }) => 
    report.userId.toString() === userId && report.status === 'pending'
  );
  
  if (existingReport) {
    throw new Error('You have already reported this code');
  }

  this.reports.push({
    userId: new mongoose.Types.ObjectId(userId),
    ...reportData,
    status: 'pending'
  });
  
  this.reportCount = this.reports.filter((r: { status: string }) => r.status === 'pending').length;
  this.lastReportedAt = new Date();
  
  await this.save();
  
  // Auto-flag if report count exceeds threshold
  if (this.reportCount >= 5) {
    this.isFraudulent = true;
    await this.save();
  }
  
  return this;
};

// Define indexes without duplicates
CraftlandCodeSchema.index({ region: 1 });
CraftlandCodeSchema.index({ isVerified: 1 });
CraftlandCodeSchema.index({ createdAt: -1 });
CraftlandCodeSchema.index({ category: 1 });
CraftlandCodeSchema.index({ creator: 1 });
CraftlandCodeSchema.index({ downloadCount: -1 });
CraftlandCodeSchema.index({ status: 1 });
CraftlandCodeSchema.index({ submittedBy: 1 });
CraftlandCodeSchema.index({ lastModifiedAt: -1 });

// Pre-save hook for sanitization
CraftlandCodeSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.title = this.title.trim();
  }
  if (this.isModified('description')) {
    this.description = this.description.trim();
  }
  if (this.isModified('author')) {
    this.author = this.author?.trim();
  }
  if (this.isModified('tags') && this.tags) {
    this.tags = this.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean);
  }
  next();
});

export default mongoose.models.CraftlandCode || mongoose.model<ICraftlandCode>('CraftlandCode', CraftlandCodeSchema); 