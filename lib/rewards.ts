import { TransactionType } from './transactions';
import { TransactionError } from './errors';
import User from '@/models/User';
import mongoose from 'mongoose';

export interface RewardConfig {
  type: TransactionType;
  amount: number;
  maxPerDay?: number;
  maxPerUser?: number;
  cooldown?: number; // in minutes
  requirements?: {
    minLevel?: number;
    minCoins?: number;
    minReferrals?: number;
  };
}

export const REWARD_CONFIGS: Record<string, RewardConfig> = {
  REFERRAL_REWARD: {
    type: 'REFERRAL_REWARD',
    amount: 100,
    maxPerDay: 10,
    maxPerUser: 1,
    requirements: {
      minLevel: 1
    }
  },
  REFERRAL_BONUS: {
    type: 'REFERRAL_BONUS',
    amount: 50,
    maxPerUser: 1,
    requirements: {
      minLevel: 1
    }
  },
  CODE_VERIFICATION: {
    type: 'CODE_VERIFICATION',
    amount: 10,
    maxPerDay: 5,
    cooldown: 60,
    requirements: {
      minLevel: 1
    }
  },
  HELPFUL_VOTE: {
    type: 'HELPFUL_VOTE',
    amount: 5,
    maxPerDay: 20,
    cooldown: 30,
    requirements: {
      minLevel: 1
    }
  },
  QUIZ_REWARD: {
    type: 'QUIZ_REWARD',
    amount: 25,
    maxPerDay: 3,
    cooldown: 120,
    requirements: {
      minLevel: 1
    }
  }
};

export async function awardReward(
  userId: string,
  rewardType: string,
  reference?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const config = REWARD_CONFIGS[rewardType];
  if (!config) {
    throw new TransactionError(`Invalid reward type: ${rewardType}`);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new TransactionError('User not found');
  }

  // Check if user is active
  if (!user.isActive || user.isBlocked) {
    throw new TransactionError('User account is not active');
  }

  // Check requirements
  if (config.requirements) {
    if (config.requirements.minLevel && user.level < config.requirements.minLevel) {
      throw new TransactionError(`User level too low for ${rewardType}`);
    }
    if (config.requirements.minCoins && user.coins < config.requirements.minCoins) {
      throw new TransactionError(`Insufficient coins for ${rewardType}`);
    }
    if (config.requirements.minReferrals && user.referralCount < config.requirements.minReferrals) {
      throw new TransactionError(`Insufficient referrals for ${rewardType}`);
    }
  }

  // Check cooldown
  if (config.cooldown) {
    const lastReward = await mongoose.models.Transaction.findOne({
      userId,
      type: config.type,
      createdAt: { $gte: new Date(Date.now() - config.cooldown * 60000) }
    });

    if (lastReward) {
      throw new TransactionError(`Reward on cooldown for ${rewardType}`);
    }
  }

  // Check daily limit
  if (config.maxPerDay) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRewards = await mongoose.models.Transaction.countDocuments({
      userId,
      type: config.type,
      createdAt: { $gte: today }
    });

    if (todayRewards >= config.maxPerDay) {
      throw new TransactionError(`Daily limit reached for ${rewardType}`);
    }
  }

  // Check per-user limit
  if (config.maxPerUser && reference) {
    const userRewards = await mongoose.models.Transaction.countDocuments({
      userId,
      type: config.type,
      'metadata.reference': reference
    });

    if (userRewards >= config.maxPerUser) {
      throw new TransactionError(`Per-user limit reached for ${rewardType}`);
    }
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Award the reward
    await mongoose.models.Transaction.create([{
      userId,
      type: config.type,
      amount: config.amount,
      status: 'COMPLETED',
      reference,
      metadata: {
        ...metadata,
        previousBalance: user.coins,
        newBalance: user.coins + config.amount
      }
    }], { session });

    // Update user's coin balance
    user.coins += config.amount;
    await user.save({ session });

    // Log the activity
    await user.logActivity('reward_earned', {
      type: rewardType,
      amount: config.amount,
      reference
    });

    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();
    throw new TransactionError(`Failed to award reward: ${error?.message || 'Unknown error'}`);
  } finally {
    session.endSession();
  }
}

export async function getRewardHistory(
  userId: string,
  limit: number = 10,
  skip: number = 0
): Promise<any[]> {
  return mongoose.models.Transaction.find({
    userId,
    type: { $in: Object.keys(REWARD_CONFIGS) }
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

export async function getRewardStats(userId: string): Promise<any> {
  const stats = await mongoose.models.Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: { $in: Object.keys(REWARD_CONFIGS) }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        total: { $sum: '$amount' }
      }
    }
  ]);

  return stats;
} 