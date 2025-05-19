import { withTransaction } from './db';
import User from '@/models/User';
import mongoose from 'mongoose';
import { TransactionError } from './errors';

export type TransactionType = 
  | 'REFERRAL_REWARD'
  | 'REFERRAL_BONUS'
  | 'CODE_VERIFICATION'
  | 'HELPFUL_VOTE'
  | 'QUIZ_REWARD'
  | 'STORE_PURCHASE'
  | 'STORE_REFUND'
  | 'ADMIN_ADJUSTMENT'
  | 'FRAUD_PENALTY';

export interface TransactionData {
  userId: string;
  type: TransactionType;
  amount: number;
  reference?: string;
  metadata?: Record<string, any>;
}

// Helper function to check if user has sufficient balance
async function hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
  const user = await User.findById(userId).select('coins').lean();
  if (!user) return false;
  return user.coins + amount >= 0;
}

export async function createTransaction(data: TransactionData) {
  // Validate amount
  if (isNaN(data.amount)) {
    throw new TransactionError('Invalid amount');
  }

  // Check for negative balance
  if (data.amount < 0 && !await hasSufficientBalance(data.userId, data.amount)) {
    throw new TransactionError('Insufficient balance');
  }

  return withTransaction(async (tx) => {
    // Update user's coin balance
    const updatedUser = await User.findByIdAndUpdate(
      data.userId,
      { $inc: { coins: data.amount } },
      { new: true }
    );

    if (!updatedUser) {
      throw new TransactionError('User not found');
    }

    // Log the transaction
    const transaction = await mongoose.models.Transaction.create({
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      status: 'COMPLETED',
      reference: data.reference,
      metadata: {
        ...data.metadata,
        previousBalance: updatedUser.coins - data.amount,
        newBalance: updatedUser.coins
      }
    });

    return transaction;
  });
}

export async function handleReferralTransaction(
  referrerId: string,
  referredId: string,
  rewardAmount: number
) {
  return withTransaction(async (tx) => {
    // Create referral record
    const referral = await mongoose.models.Referral.create({
      referrerId,
      referredId,
      code: (await User.findById(referrerId))?.referralCode,
      status: 'PENDING',
      rewardAmount,
      rewardType: 'REFERRAL_REWARD',
      metadata: {
        transactionType: 'referral_reward'
      }
    });

    try {
      // Award referrer
      await createTransaction({
        userId: referrerId,
        type: 'REFERRAL_REWARD',
        amount: rewardAmount,
        reference: referral._id.toString(),
        metadata: {
          referredUserId: referredId,
          transactionType: 'referral_reward'
        }
      });

      // Award referred user
      await createTransaction({
        userId: referredId,
        type: 'REFERRAL_BONUS',
        amount: rewardAmount,
        reference: referral._id.toString(),
        metadata: {
          referrerId,
          transactionType: 'referral_bonus'
        }
      });

      // Update referral status
      referral.status = 'COMPLETED';
      referral.rewardStatus = 'AWARDED';
      await referral.save();

      return referral;
    } catch (error) {
      // Update referral status on failure
      referral.status = 'REJECTED';
      referral.rewardStatus = 'FAILED';
      await referral.save();

      throw error;
    }
  });
}

export async function handleQuizReward(
  userId: string,
  quizId: string,
  score: number,
  coinsEarned: number
) {
  return createTransaction({
    userId,
    type: 'QUIZ_REWARD',
    amount: coinsEarned,
    reference: quizId,
    metadata: {
      quizId,
      score,
      transactionType: 'quiz_reward'
    }
  });
}

export async function handleStorePurchase(
  userId: string,
  orderId: string,
  amount: number
) {
  // Validate amount
  if (amount <= 0) {
    throw new TransactionError('Invalid purchase amount');
  }

  // Check balance before purchase
  if (!await hasSufficientBalance(userId, -amount)) {
    throw new TransactionError('Insufficient balance for purchase');
  }

  return createTransaction({
    userId,
    type: 'STORE_PURCHASE',
    amount: -amount,
    reference: orderId,
    metadata: {
      orderId,
      transactionType: 'store_purchase'
    }
  });
}

export async function handleStoreRefund(
  userId: string,
  orderId: string,
  amount: number
) {
  // Validate amount
  if (amount <= 0) {
    throw new TransactionError('Invalid refund amount');
  }

  return createTransaction({
    userId,
    type: 'STORE_REFUND',
    amount,
    reference: orderId,
    metadata: {
      orderId,
      transactionType: 'store_refund'
    }
  });
}

export async function handleAdminAdjustment(
  userId: string,
  amount: number,
  reason: string,
  adminId: string
) {
  // Validate amount
  if (isNaN(amount)) {
    throw new TransactionError('Invalid adjustment amount');
  }

  // Check for negative balance
  if (amount < 0 && !await hasSufficientBalance(userId, amount)) {
    throw new TransactionError('Insufficient balance for adjustment');
  }

  return createTransaction({
    userId,
    type: 'ADMIN_ADJUSTMENT',
    amount,
    reference: adminId,
    metadata: {
      reason,
      adminId,
      transactionType: 'admin_adjustment'
    }
  });
}

export async function handleFraudPenalty(
  userId: string,
  amount: number,
  reason: string
) {
  // Validate amount
  if (amount <= 0) {
    throw new TransactionError('Invalid penalty amount');
  }

  // Check balance before penalty
  if (!await hasSufficientBalance(userId, -amount)) {
    throw new TransactionError('Insufficient balance for penalty');
  }

  return createTransaction({
    userId,
    type: 'FRAUD_PENALTY',
    amount: -amount,
    reference: reason,
    metadata: {
      reason,
      transactionType: 'fraud_penalty'
    }
  });
}

// Helper function to get user's transaction history with balance tracking
export async function getUserTransactionHistory(
  userId: string,
  limit: number = 10,
  skip: number = 0
) {
  const transactions = await mongoose.models.Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return transactions;
}

// Helper function to get user's coin balance
export async function getUserCoinBalance(userId: string) {
  const user = await User.findById(userId).select('coins').lean();
  return user?.coins || 0;
}

// Helper function to get user's transaction statistics
export async function getUserTransactionStats(userId: string) {
  const stats = await mongoose.models.Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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