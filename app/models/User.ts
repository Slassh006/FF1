import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const REWARD_FOR_VERIFIED_CODE = 100; // Coins awarded for verified code
const REWARD_FOR_HELPFUL_VOTE = 10; // Coins awarded for helpful vote

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'subscriber';
  isAdmin: boolean;
  permissions: string[];
  coins: number;
  avatar?: string;
  emailVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  lastLogin?: Date;
  preferences?: {
    theme?: string;
    language?: string;
    timezone?: string;
    notifications?: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  referralCode?: string;
  rewardHistory: {
    type: 'code_verification' | 'helpful_vote' | 'fraud_penalty';
    amount: number;
    reference: mongoose.Types.ObjectId;
    referenceType: 'CraftlandCode' | 'Vote';
    createdAt: Date;
  }[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): Promise<string>;
  awardVerifiedCodeReward(codeId: string): Promise<void>;
  awardHelpfulVoteReward(voteId: string): Promise<void>;
  deductCoinsForFraud(amount: number, reason: string): Promise<void>;
}

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'subscriber'],
    default: 'subscriber'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String
  }],
  coins: {
    type: Number,
    default: 0,
    min: 0
  },
  avatar: {
    type: String
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  preferences: {
    theme: {
      type: String,
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    }
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  rewardHistory: [{
    type: {
      type: String,
      enum: ['code_verification', 'helpful_vote', 'fraud_penalty'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    reference: {
      type: Schema.Types.ObjectId,
      refPath: 'rewardHistory.referenceType'
    },
    referenceType: {
      type: String,
      enum: ['CraftlandCode', 'Vote'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add method to generate email verification token
UserSchema.methods.generateEmailVerificationToken = async function(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await this.save();
  return token;
};

// Add method to award coins for verified code
UserSchema.methods.awardVerifiedCodeReward = async function(codeId: string) {
  this.coins += REWARD_FOR_VERIFIED_CODE;
  this.rewardHistory.push({
    type: 'code_verification',
    amount: REWARD_FOR_VERIFIED_CODE,
    reference: codeId,
    referenceType: 'CraftlandCode'
  });
  await this.save();
};

// Add method to award coins for helpful vote
UserSchema.methods.awardHelpfulVoteReward = async function(voteId: string) {
  this.coins += REWARD_FOR_HELPFUL_VOTE;
  this.rewardHistory.push({
    type: 'helpful_vote',
    amount: REWARD_FOR_HELPFUL_VOTE,
    reference: voteId,
    referenceType: 'Vote'
  });
  await this.save();
};

// Add method to deduct coins for fraudulent behavior
UserSchema.methods.deductCoinsForFraud = async function(amount: number, reason: string) {
  if (this.coins < amount) {
    this.coins = 0;
  } else {
    this.coins -= amount;
  }
  this.rewardHistory.push({
    type: 'fraud_penalty',
    amount: -amount,
    reference: reason,
    referenceType: 'Vote'
  });
  await this.save();
};

// Add indexes for efficient querying
UserSchema.index({ role: 1 });
UserSchema.index({ lastLogin: -1 });
UserSchema.index({ coins: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'activityLog.type': 1, 'activityLog.createdAt': -1 });
UserSchema.index({ 'activityLog.ip': 1, 'activityLog.createdAt': -1 });
UserSchema.index({ 'appliedReferrals.referrerId': 1 });
UserSchema.index({ 'appliedReferrals.appliedAt': -1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);