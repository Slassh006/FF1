import cron from 'node-cron';
import dbConnect from '@/app/lib/dbConnect';
import Analytics, { IAnalytics, IAnalyticsModel } from '@/app/models/Analytics';
import CraftlandCode from '@/app/models/CraftlandCode';
import { User } from '@/app/models/User';
import Notification from '@/app/models/Notification';

const BATCH_SIZE = 1000;

async function processInBatches<T>(
  model: any,
  pipeline: any[],
  processFn: (batch: T[]) => Promise<void>
) {
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const batchPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: BATCH_SIZE }
    ];

    const batch = await model.aggregate(batchPipeline);
    if (batch.length === 0) {
      hasMore = false;
    } else {
      await processFn(batch);
      skip += batch.length;
    }
  }
}

async function notifyError(error: any, context: string) {
  try {
    await Notification.create({
      type: 'system_error',
      title: 'Analytics Update Error',
      message: `Error in ${context}: ${error.message}`,
      severity: 'high',
      data: {
        error: error.message,
        stack: error.stack,
        context
      }
    });
  } catch (notificationError) {
    console.error('Failed to create error notification:', notificationError);
  }
}

// Update analytics every hour
export function scheduleAnalyticsUpdate() {
  cron.schedule('0 * * * *', async () => {
    try {
      await dbConnect();
      console.log('Updating analytics data...');

      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      // Get daily code submission statistics
      const dailyCodeStats = await CraftlandCode.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            fraudulent: { $sum: { $cond: [{ $eq: ['$isFraudulent', true] }, 1, 0] } }
          }
        }
      ]).catch(async error => {
        console.error('Error aggregating daily code statistics:', error);
        await notifyError(error, 'daily code statistics aggregation');
        return [];
      });

      // Get hourly code submission statistics
      const hourlyCodeStats = await CraftlandCode.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
          }
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]).catch(async error => {
        console.error('Error aggregating hourly code statistics:', error);
        await notifyError(error, 'hourly code statistics aggregation');
        return [];
      });

      // Get code submission statistics
      const codeStats = await CraftlandCode.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
            fraudulent: { $sum: { $cond: [{ $eq: ['$isFraudulent', true] }, 1, 0] } }
          }
        }
      ]).catch(async error => {
        console.error('Error aggregating code statistics:', error);
        await notifyError(error, 'code statistics aggregation');
        return [];
      });

      // Get user engagement statistics
      const userStats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: '$submittedCodes' }, 0] },
                  1,
                  0
                ]
              }
            },
            totalVotes: { $sum: { $size: '$votedCodes' } },
            totalSubmissions: { $sum: { $size: '$submittedCodes' } }
          }
        }
      ]).catch(async error => {
        console.error('Error aggregating user statistics:', error);
        await notifyError(error, 'user statistics aggregation');
        return [];
      });

      // Get fraud detection statistics
      const fraudStats = await CraftlandCode.aggregate([
        {
          $match: { isFraudulent: true }
        },
        {
          $group: {
            _id: null,
            totalDetected: { $sum: 1 },
            byType: {
              $push: {
                type: '$fraudType',
                count: 1
              }
            }
          }
        }
      ]).catch(async error => {
        console.error('Error aggregating fraud statistics:', error);
        await notifyError(error, 'fraud statistics aggregation');
        return [];
      });

      // Get regional distribution
      const regionalStats = await CraftlandCode.aggregate([
        {
          $group: {
            _id: '$region',
            totalCodes: { $sum: 1 },
            verifiedCodes: {
              $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
            },
            fraudulentCodes: {
              $sum: { $cond: [{ $eq: ['$isFraudulent', true] }, 1, 0] }
            }
          }
        }
      ]).catch(async error => {
        console.error('Error aggregating regional statistics:', error);
        await notifyError(error, 'regional statistics aggregation');
        return [];
      });

      // Update analytics in database
      const AnalyticsModel = Analytics as IAnalyticsModel;

      await Promise.all([
        AnalyticsModel.updateAnalytics('code_submission', {
          submissions: {
            ...codeStats[0] || {},
            daily: [{
              date: startOfDay,
              count: dailyCodeStats[0]?.total || 0
            }],
            hourly: hourlyCodeStats.map((stat: any) => ({
              hour: stat._id,
              count: stat.count
            }))
          }
        }).catch(async error => {
          console.error('Error updating code submission analytics:', error);
          await notifyError(error, 'code submission analytics update');
        }),
        AnalyticsModel.updateAnalytics('user_engagement', {
          engagement: {
            ...userStats[0] || {},
            averageVotesPerUser: userStats[0]?.totalVotes / userStats[0]?.totalUsers || 0,
            averageSubmissionsPerUser: userStats[0]?.totalSubmissions / userStats[0]?.totalUsers || 0,
            userRetention: [] // This should be populated with actual retention data
          }
        }).catch(async error => {
          console.error('Error updating user engagement analytics:', error);
          await notifyError(error, 'user engagement analytics update');
        }),
        AnalyticsModel.updateAnalytics('fraud_detection', {
          fraud: {
            totalDetected: fraudStats[0]?.totalDetected || 0,
            byType: {
              rapidSubmissions: fraudStats[0]?.byType?.filter((t: any) => t.type === 'rapidSubmissions').length || 0,
              suspiciousVoting: fraudStats[0]?.byType?.filter((t: any) => t.type === 'suspiciousVoting').length || 0,
              duplicateCodes: fraudStats[0]?.byType?.filter((t: any) => t.type === 'duplicateCodes').length || 0
            },
            daily: [{
              date: startOfDay,
              count: fraudStats[0]?.totalDetected || 0
            }],
            topRegions: regionalStats
              .sort((a: any, b: any) => b.fraudulentCodes - a.fraudulentCodes)
              .slice(0, 5)
              .map((region: any) => ({
                region: region._id,
                count: region.fraudulentCodes
              }))
          }
        }).catch(async error => {
          console.error('Error updating fraud detection analytics:', error);
          await notifyError(error, 'fraud detection analytics update');
        }),
        AnalyticsModel.updateAnalytics('regional_distribution', {
          regions: regionalStats.map(region => ({
            name: region._id,
            totalCodes: region.totalCodes,
            verifiedCodes: region.verifiedCodes,
            activeUsers: 0, // This should be calculated separately
            fraudRate: region.fraudulentCodes / region.totalCodes
          }))
        }).catch(async error => {
          console.error('Error updating regional distribution analytics:', error);
          await notifyError(error, 'regional distribution analytics update');
        })
      ]);

      console.log('Analytics update completed successfully');
    } catch (error) {
      console.error('Critical error in analytics update:', error);
      await notifyError(error, 'analytics update process');
    }
  });
} 