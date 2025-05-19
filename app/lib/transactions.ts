import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    try {
      return await callback(tx as unknown as PrismaClient);
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  });
}

export async function handleReferralTransaction(
  referrerId: string,
  referredId: string,
  rewardAmount: number
) {
  return withTransaction(async (tx) => {
    // Update referrer's coins
    await tx.user.update({
      where: { id: referrerId },
      data: {
        coins: {
          increment: rewardAmount
        }
      }
    });

    // Update referred user's referral status
    await tx.user.update({
      where: { id: referredId },
      data: {
        referredBy: referrerId,
        referralRewarded: true
      }
    });

    // Log the transaction
    await tx.transaction.create({
      data: {
        userId: referrerId,
        type: 'REFERRAL_REWARD',
        amount: rewardAmount,
        status: 'COMPLETED',
        metadata: {
          referredUserId: referredId
        }
      }
    });
  });
} 