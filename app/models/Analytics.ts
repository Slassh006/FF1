import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalytics extends Document {
  type: 'code_submission' | 'user_engagement' | 'fraud_detection' | 'regional_distribution';
  data: {
    // Code Submission Trends
    submissions?: {
      total: number;
      verified: number;
      pending: number;
      rejected: number;
      fraudulent: number;
      daily: Array<{ date: Date; count: number }>;
      hourly: Array<{ hour: number; count: number }>;
    };
    // User Engagement Metrics
    engagement?: {
      totalUsers: number;
      activeUsers: number;
      averageVotesPerUser: number;
      averageSubmissionsPerUser: number;
      userRetention: Array<{ day: number; percentage: number }>;
    };
    // Fraud Detection Statistics
    fraud?: {
      totalDetected: number;
      byType: {
        rapidSubmissions: number;
        suspiciousVoting: number;
        duplicateCodes: number;
      };
      daily: Array<{ date: Date; count: number }>;
      topRegions: Array<{ region: string; count: number }>;
    };
    // Regional Distribution
    regions?: Array<{
      code: string;
      name: string;
      totalCodes: number;
      verifiedCodes: number;
      activeUsers: number;
      fraudRate: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnalyticsModel extends Model<IAnalytics> {
  updateAnalytics(type: string, newData: any): Promise<IAnalytics>;
}

const validateSubmissions = (data: any) => {
  if (!data.submissions) return false;
  const { total, verified, pending, rejected, fraudulent, daily, hourly } = data.submissions;
  return (
    typeof total === 'number' &&
    typeof verified === 'number' &&
    typeof pending === 'number' &&
    typeof rejected === 'number' &&
    typeof fraudulent === 'number' &&
    Array.isArray(daily) &&
    Array.isArray(hourly)
  );
};

const validateEngagement = (data: any) => {
  if (!data.engagement) return false;
  const { totalUsers, activeUsers, averageVotesPerUser, averageSubmissionsPerUser, userRetention } = data.engagement;
  return (
    typeof totalUsers === 'number' &&
    typeof activeUsers === 'number' &&
    typeof averageVotesPerUser === 'number' &&
    typeof averageSubmissionsPerUser === 'number' &&
    Array.isArray(userRetention)
  );
};

const validateFraud = (data: any) => {
  if (!data.fraud) return false;
  const { totalDetected, byType, daily, topRegions } = data.fraud;
  return (
    typeof totalDetected === 'number' &&
    typeof byType === 'object' &&
    Array.isArray(daily) &&
    Array.isArray(topRegions)
  );
};

const validateRegions = (data: any) => {
  if (!data.regions) return false;
  return Array.isArray(data.regions) && data.regions.every((region: any) => (
    typeof region.name === 'string' &&
    typeof region.totalCodes === 'number' &&
    typeof region.verifiedCodes === 'number' &&
    typeof region.activeUsers === 'number' &&
    typeof region.fraudRate === 'number'
  ));
};

const AnalyticsSchema = new Schema<IAnalytics, IAnalyticsModel>(
  {
    type: {
      type: String,
      enum: ['code_submission', 'user_engagement', 'fraud_detection', 'regional_distribution'],
      required: true,
      validate: {
        validator: function(v: string) {
          return ['code_submission', 'user_engagement', 'fraud_detection', 'regional_distribution'].includes(v);
        },
        message: props => `${props.value} is not a valid analytics type!`
      }
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function(v: any) {
          switch (this.type) {
            case 'code_submission':
              return validateSubmissions(v);
            case 'user_engagement':
              return validateEngagement(v);
            case 'fraud_detection':
              return validateFraud(v);
            case 'regional_distribution':
              return validateRegions(v);
            default:
              return false;
          }
        },
        message: 'Invalid data structure for analytics type'
      }
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
AnalyticsSchema.index({ type: 1, createdAt: -1 });
AnalyticsSchema.index({ 'data.submissions.daily.date': 1 });
AnalyticsSchema.index({ 'data.fraud.daily.date': 1 });

// Method to update analytics
AnalyticsSchema.statics.updateAnalytics = async function(type: string, newData: any) {
  try {
    const latest = await this.findOne({ type }).sort({ createdAt: -1 });
    
    if (latest) {
      // Merge new data with existing data
      const mergedData = {
        ...latest.data,
        ...newData,
      };
      
      return this.create({
        type,
        data: mergedData,
      });
    }
    
    return this.create({
      type,
      data: newData,
    });
  } catch (error) {
    console.error(`Error updating analytics for type ${type}:`, error);
    throw error;
  }
};

export default mongoose.models.Analytics || mongoose.model<IAnalytics, IAnalyticsModel>('Analytics', AnalyticsSchema); 