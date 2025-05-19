import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OrderStatus, StoreItemStatus } from '@/app/types/store';

// --- ADDED Interface for Applied Referral ---
interface IAppliedReferral {
  referrerId: Types.ObjectId; // ID of the user whose code was used
  codeUsed: string;           // The referral code string that was entered
  appliedAt: Date;            // Timestamp when it was applied
}
// -------------------------------------------

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'subscriber';
  permissions: string[];
  isAdmin: boolean;
  coins: number;
  avatar?: string;
  avatarFileId?: Types.ObjectId;
  avatarLastUpdatedAt?: Date;
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes: string[];
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system' | 'default';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  statistics: {
    lastActive: Date;
    loginCount: number;
    totalTimeSpent: number;
    deviceCount: number;
  };
  devices: {
    deviceId: string;
    deviceName: string;
    lastUsed: Date;
    ipAddress: string;
    userAgent: string;
  }[];
  referralCode: string;
  appliedReferrals: IAppliedReferral[];
  referralCount: number;
  savedWallpapers: Types.ObjectId[];
  favoriteCraftlandCodes: Types.ObjectId[];
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
  quizStats: {
    totalParticipated: number;
    totalWon: number;
    highestScore: number;
    totalCoinsEarned: number;
  };
  storeHistory: {
    itemId: Types.ObjectId;
    purchaseDate: Date;
    status: 'pending' | 'completed' | 'refunded';
  }[];
  cart: {
    items: {
      itemId: mongoose.Types.ObjectId;
      quantity: number;
      addedAt: Date;
    }[];
  };
  orders: mongoose.Types.ObjectId[];
  purchaseHistory: {
    orderId: mongoose.Types.ObjectId;
    date: Date;
    amount: number;
    status: 'pending' | 'completed' | 'refunded' | 'cancelled';
  }[];
  activityLog: {
    type: string;
    details: any;
    ip: string;
    userAgent: string;
    createdAt: Date;
  }[];
  inventory: {
    items: {
      itemId: Types.ObjectId;
      acquiredAt: Date;
      status: 'active' | 'used' | 'expired';
    }[];
    badges: string[];
    rewards: string[];
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): boolean;
  addCoins(amount: number, reason?: string): Promise<void>;
  deductCoins(amount: number, reason?: string): Promise<void>;
  generateResetToken(): Promise<string>;
  generateEmailVerificationToken(): Promise<string>;
  generateTwoFactorSecret(): Promise<string>;
  generateTwoFactorBackupCodes(): Promise<string[]>;
  verifyTwoFactorCode(code: string): Promise<boolean>;
  useTwoFactorBackupCode(code: string): Promise<boolean>;
  logActivity(activity: string, details?: Record<string, any>, ip?: string, userAgent?: string): Promise<void>;
  updateLastActive(): Promise<void>;
  incrementLoginCount(): Promise<void>;
  addDevice(deviceInfo: { deviceId: string; deviceName: string; ipAddress: string; userAgent: string }): Promise<void>;
  removeDevice(deviceId: string): Promise<void>;
  toggleFavoriteCraftlandCode(codeId: string): Promise<boolean>;
  hasUpvotedCraftlandCode(codeId: string): Promise<boolean>;
  hasDownvotedCraftlandCode(codeId: string): Promise<boolean>;
  hasLikedCraftlandCode(codeId: string): Promise<boolean>;

  // Add timestamp fields
  createdAt: Date;
  updatedAt: Date;

  // Add method to validate referral
  validateReferral(referralCode: string): Promise<boolean>;

  // Add method to apply referral
  applyReferral(referralCode: string): Promise<void>;
}

export const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'subscriber'],
      default: 'subscriber',
    },
    permissions: [{
      type: String,
      enum: [
        'read:blogs',
        'write:blogs',
        'read:wallpapers',
        'write:wallpapers',
        'read:users',
        'write:users',
        'read:orders',
        'write:orders',
        'manage:settings',
        'read:craftland-codes',
        'write:craftland-codes',
        'manage:craftland-codes'
      ]
    }],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    coins: {
      type: Number,
      default: 0,
      min: [0, 'Coins cannot be negative'],
    },
    avatar: {
      type: String,
    },
    avatarFileId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    avatarLastUpdatedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockReason: String,
    blockedAt: Date,
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    resetToken: String,
    resetTokenExpiry: Date,
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    twoFactorBackupCodes: [String],
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      youtube: String,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system', 'default'],
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
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true }
      }
    },
    statistics: {
      lastActive: {
        type: Date,
        default: Date.now,
      },
      loginCount: {
        type: Number,
        default: 0,
      },
      totalTimeSpent: {
        type: Number,
        default: 0,
      },
      deviceCount: {
        type: Number,
        default: 0,
      },
    },
    devices: [{
      deviceId: String,
      deviceName: String,
      lastUsed: Date,
      ipAddress: String,
      userAgent: String,
    }],
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    appliedReferrals: [{
      referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      codeUsed: { type: String, required: true },
      appliedAt: { type: Date, default: Date.now }
    }],
    referralCount: {
      type: Number,
      default: 0,
    },
    savedWallpapers: [{
      type: Schema.Types.ObjectId,
      ref: 'Wallpaper',
    }],
    favoriteCraftlandCodes: [{
      type: Schema.Types.ObjectId,
      ref: 'CraftlandCode',
    }],
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
    },
    quizStats: {
      totalParticipated: { type: Number, default: 0 },
      totalWon: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      totalCoinsEarned: { type: Number, default: 0 },
    },
    storeHistory: [{
      itemId: { type: Schema.Types.ObjectId, ref: 'StoreItem' },
      purchaseDate: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING,
      },
    }],
    cart: {
      type: {
        items: [{
          itemId: {
            type: Schema.Types.ObjectId,
            ref: 'StoreItem'
          },
          quantity: {
            type: Number,
            default: 1,
            min: 1
          },
          addedAt: {
            type: Date,
            default: Date.now
          }
        }]
      },
      default: { items: [] }
    },
    orders: [{
      type: Schema.Types.ObjectId,
      ref: 'Order',
    }],
    purchaseHistory: [{
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
      date: {
        type: Date,
        default: Date.now,
      },
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING,
      },
    }],
    activityLog: [{
      type: { type: String },
      details: { type: Schema.Types.Mixed },
      ip: { type: String },
      userAgent: { type: String },
      createdAt: { type: Date, default: Date.now }
    }],
    inventory: {
      items: [{
        itemId: {
          type: Schema.Types.ObjectId,
          ref: 'StoreItem',
        },
        acquiredAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: Object.values(StoreItemStatus),
          default: StoreItemStatus.ACTIVE,
        },
      }],
      badges: [String],
      rewards: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique referral code
async function generateUniqueReferralCode(name: string): Promise<string> {
  const namePart = name.substring(0, 3).toUpperCase();
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  const code = `${namePart}${randomPart}`;
  
  // Check if code exists
  const existingUser = await mongoose.models.User.findOne({ referralCode: code });
  if (existingUser) {
    // If code exists, generate a new one recursively
    return generateUniqueReferralCode(name);
  }
  
  return code;
}

// Generate referral code before saving
UserSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    try {
      this.referralCode = await generateUniqueReferralCode(this.name);
    } catch (error) {
      next(error);
      return;
    }
  }
  
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      next(error);
      return;
    }
  }
  
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Add method to check permissions
UserSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission) || this.role === 'admin';
};

// Add coins method
UserSchema.methods.addCoins = async function(amount: number, reason?: string): Promise<void> {
  if (amount < 0) throw new Error('Amount must be positive');
  
  try {
    await mongoose.models.Transaction.create({
      userId: this._id,
      type: 'ADMIN_ADJUSTMENT',
      amount,
      status: 'COMPLETED',
      metadata: {
        reason,
        previousBalance: this.coins,
        newBalance: this.coins + amount
      }
    });

  this.coins += amount;
    await this.logActivity('coins_added', { amount, reason });
  await this.save();
  } catch (error) {
    throw new Error(`Failed to add coins: ${error.message}`);
  }
};

// Deduct coins method
UserSchema.methods.deductCoins = async function(amount: number, reason?: string): Promise<void> {
  if (amount < 0) throw new Error('Amount must be positive');
  if (this.coins < amount) throw new Error('Insufficient coins');
  
  try {
    await mongoose.models.Transaction.create({
      userId: this._id,
      type: 'ADMIN_ADJUSTMENT',
      amount: -amount,
      status: 'COMPLETED',
      metadata: {
        reason,
        previousBalance: this.coins,
        newBalance: this.coins - amount
      }
    });

  this.coins -= amount;
    await this.logActivity('coins_removed', { amount, reason });
  await this.save();
  } catch (error) {
    throw new Error(`Failed to deduct coins: ${error.message}`);
  }
};

// Get coin balance method
UserSchema.methods.getCoinBalance = async function(): Promise<number> {
  return this.coins;
};

// Get transaction history method
UserSchema.methods.getTransactionHistory = async function(
  limit: number = 10,
  skip: number = 0
): Promise<any[]> {
  return mongoose.models.Transaction.find({ userId: this._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Get transaction statistics method
UserSchema.methods.getTransactionStats = async function(): Promise<any> {
  const stats = await mongoose.models.Transaction.aggregate([
    { $match: { userId: this._id } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        total: { $sum: '$amount' }
      }
    }
  ]);

  return stats;
};

// Generate reset token method
UserSchema.methods.generateResetToken = async function(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetToken = token;
  this.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
  await this.save();
  await this.logActivity('password_reset_requested');
  return token;
};

// Generate email verification token
UserSchema.methods.generateEmailVerificationToken = async function(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpiry = new Date(Date.now() + 86400000); // 24 hours
  await this.save();
  await this.logActivity('email_verification_requested');
  return token;
};

// Generate 2FA secret
UserSchema.methods.generateTwoFactorSecret = async function(): Promise<string> {
  const secret = crypto.randomBytes(20).toString('hex');
  this.twoFactorSecret = secret;
  await this.save();
  await this.logActivity('two_factor_secret_generated');
  return secret;
};

// Generate 2FA backup codes
UserSchema.methods.generateTwoFactorBackupCodes = async function(): Promise<string[]> {
  const codes = Array.from({ length: 8 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
  this.twoFactorBackupCodes = codes;
  await this.save();
  await this.logActivity('two_factor_backup_codes_generated');
  return codes;
};

// Verify 2FA code
UserSchema.methods.verifyTwoFactorCode = async function(code: string): Promise<boolean> {
  if (!this.twoFactorSecret) return false;
  
  // Implement TOTP verification here
  // For now, return true for testing
  return true;
};

// Use 2FA backup code
UserSchema.methods.useTwoFactorBackupCode = async function(code: string): Promise<boolean> {
  const index = this.twoFactorBackupCodes.indexOf(code);
  if (index === -1) return false;
  
  this.twoFactorBackupCodes.splice(index, 1);
  await this.save();
  await this.logActivity('two_factor_backup_code_used');
  return true;
};

// Log activity method
UserSchema.methods.logActivity = async function(activity: string, details: Record<string, any> = {}, ip: string = 'unknown', userAgent: string = 'unknown'): Promise<void> {
  this.activityLog.push({
    type: activity,
    details,
    ip,
    userAgent,
    createdAt: new Date()
  });
  await this.save();
};

// Update last active
UserSchema.methods.updateLastActive = async function(): Promise<void> {
  this.statistics.lastActive = new Date();
  await this.save();
};

// Increment login count
UserSchema.methods.incrementLoginCount = async function(): Promise<void> {
  this.statistics.loginCount += 1;
  this.lastLogin = new Date();
  await this.save();
};

// Add device
UserSchema.methods.addDevice = async function(deviceInfo: { 
  deviceId: string; 
  deviceName: string; 
  ipAddress: string; 
  userAgent: string; 
}): Promise<void> {
  const existingDevice = this.devices.find((d: { deviceId: string }) => d.deviceId === deviceInfo.deviceId);
  if (existingDevice) {
    existingDevice.lastUsed = new Date();
    existingDevice.ipAddress = deviceInfo.ipAddress;
    existingDevice.userAgent = deviceInfo.userAgent;
  } else {
    this.devices.push({
      ...deviceInfo,
      lastUsed: new Date(),
    });
    this.statistics.deviceCount += 1;
  }
  await this.save();
};

// Remove device
UserSchema.methods.removeDevice = async function(deviceId: string): Promise<void> {
  this.devices = this.devices.filter((d: { deviceId: string }) => d.deviceId !== deviceId);
  this.statistics.deviceCount = this.devices.length;
  await this.save();
};

// Add methods for craftland code management
UserSchema.methods.toggleFavoriteCraftlandCode = async function(codeId: string): Promise<boolean> {
  const codeObjectId = new mongoose.Types.ObjectId(codeId);
  const index = this.favoriteCraftlandCodes.findIndex((id: mongoose.Types.ObjectId) => id.equals(codeObjectId));
  
  if (index === -1) {
    this.favoriteCraftlandCodes.push(codeObjectId);
  } else {
    this.favoriteCraftlandCodes.splice(index, 1);
  }
  
  await this.save();
  return index === -1; // Return true if added to favorites, false if removed
};

UserSchema.methods.hasUpvotedCraftlandCode = async function(codeId: string): Promise<boolean> {
  const code = await mongoose.model('CraftlandCode').findById(codeId);
  return code ? code.upvotes.includes(this._id) : false;
};

UserSchema.methods.hasDownvotedCraftlandCode = async function(codeId: string): Promise<boolean> {
  const code = await mongoose.model('CraftlandCode').findById(codeId);
  return code ? code.downvotes.includes(this._id) : false;
};

UserSchema.methods.hasLikedCraftlandCode = async function(codeId: string): Promise<boolean> {
  const code = await mongoose.model('CraftlandCode').findById(codeId);
  return code ? code.likes.includes(this._id) : false;
};

// Add method to validate referral
UserSchema.methods.validateReferral = async function(referralCode: string): Promise<boolean> {
  // Check if user is trying to use their own code
  if (this.referralCode === referralCode) {
    throw new Error('Cannot use your own referral code');
  }

  // Check if user has already been referred
  if (this.appliedReferrals.length > 0) {
    throw new Error('User has already been referred');
  }

  // Check if referral code exists
  const referrer = await mongoose.models.User.findOne({ referralCode });
  if (!referrer) {
    throw new Error('Invalid referral code');
  }

  // Check if referrer is active
  if (!referrer.isActive || referrer.isBlocked) {
    throw new Error('Referrer account is not active');
  }

  return true;
};

// Add method to apply referral
UserSchema.methods.applyReferral = async function(referralCode: string): Promise<void> {
  await this.validateReferral(referralCode);

  const referrer = await mongoose.models.User.findOne({ referralCode });
  if (!referrer) {
    throw new Error('Invalid referral code');
  }

  // Add to applied referrals
  this.appliedReferrals.push({
    referrerId: referrer._id,
    codeUsed: referralCode,
    appliedAt: new Date()
  });

  // Increment referrer's count
  referrer.referralCount += 1;
  await referrer.save();

  // Award rewards
  try {
    // Award referrer
    await mongoose.models.Transaction.create({
      userId: referrer._id,
      type: 'REFERRAL_REWARD',
      amount: 100,
      status: 'COMPLETED',
      metadata: {
        referredUserId: this._id,
        transactionType: 'referral_reward'
      }
    });

    // Award referred user
    await mongoose.models.Transaction.create({
      userId: this._id,
      type: 'REFERRAL_BONUS',
      amount: 50,
      status: 'COMPLETED',
      metadata: {
        referrerId: referrer._id,
        transactionType: 'referral_bonus'
      }
    });

    // Update balances
    referrer.coins += 100;
    this.coins += 50;

    await Promise.all([
      referrer.save(),
      this.save()
    ]);

    // Log activities
    await Promise.all([
      referrer.logActivity('referral_reward_earned', {
        referredUserId: this._id,
        amount: 100
      }),
      this.logActivity('referral_bonus_earned', {
        referrerId: referrer._id,
        amount: 50
      })
    ]);
  } catch (error) {
    throw new Error(`Failed to process referral rewards: ${error.message}`);
  }
};

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ name: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ lastLogin: -1 });
UserSchema.index({ coins: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'activityLog.type': 1, 'activityLog.createdAt': -1 }); // Example compound index
UserSchema.index({ 'activityLog.ip': 1, 'activityLog.createdAt': -1 });
UserSchema.index({ 'appliedReferrals.referrerId': 1 });
UserSchema.index({ 'appliedReferrals.appliedAt': -1 });

// Add virtuals or other schema options if needed

// Export the model
// Use mongoose.models to prevent overwriting model in HMR scenarios
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 