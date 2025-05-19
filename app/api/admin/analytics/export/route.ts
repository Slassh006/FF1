import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/lib/db';
import Analytics from '../../../../models/Analytics';
import { IAnalytics } from '../../../../models/Analytics';
import { format } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch latest analytics for each type
    const types: IAnalytics['type'][] = [
      'code_submission',
      'user_engagement',
      'fraud_detection',
      'regional_distribution'
    ];

    const analyticsData: Record<string, any> = {};
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

    for (const type of types) {
      const latest = await Analytics.findOne({ type })
        .sort({ createdAt: -1 })
        .select('data -_id')
        .lean<Pick<IAnalytics, 'data'>>();

      if (latest) {
        analyticsData[type] = latest.data;
      }
    }

    // Format data for export
    const formattedData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        version: '1.0'
      },
      data: {
        code_submission: formatCodeSubmissionData(analyticsData.code_submission),
        user_engagement: formatUserEngagementData(analyticsData.user_engagement),
        fraud_detection: formatFraudDetectionData(analyticsData.fraud_detection),
        regional_distribution: formatRegionalDistributionData(analyticsData.regional_distribution)
      }
    };

    // Create CSV content
    const csvContent = generateCSVContent(formattedData);

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics_export_${timestamp}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }

    // Return appropriate error response
    return NextResponse.json(
      { 
        error: 'Failed to export analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function formatCodeSubmissionData(data: any) {
  if (!data) return null;
  return {
    summary: {
      total: data.submissions?.total || 0,
      verified: data.submissions?.verified || 0,
      pending: data.submissions?.pending || 0,
      rejected: data.submissions?.rejected || 0,
      fraudulent: data.submissions?.fraudulent || 0
    },
    dailyTrends: data.submissions?.daily?.map((day: any) => ({
      date: format(new Date(day.date), 'yyyy-MM-dd'),
      count: day.count
    })) || [],
    hourlyTrends: data.submissions?.hourly?.map((hour: any) => ({
      hour: hour.hour,
      count: hour.count
    })) || []
  };
}

function formatUserEngagementData(data: any) {
  if (!data) return null;
  return {
    summary: {
      totalUsers: data.engagement?.totalUsers || 0,
      activeUsers: data.engagement?.activeUsers || 0,
      averageVotesPerUser: data.engagement?.averageVotesPerUser || 0,
      averageSubmissionsPerUser: data.engagement?.averageSubmissionsPerUser || 0
    },
    retention: data.engagement?.userRetention?.map((retention: any) => ({
      days: retention.day,
      percentage: retention.percentage
    })) || []
  };
}

function formatFraudDetectionData(data: any) {
  if (!data) return null;
  return {
    summary: {
      totalDetected: data.fraud?.totalDetected || 0,
      byType: data.fraud?.byType || {}
    },
    dailyTrends: data.fraud?.daily?.map((day: any) => ({
      date: format(new Date(day.date), 'yyyy-MM-dd'),
      count: day.count
    })) || [],
    topRegions: data.fraud?.topRegions || []
  };
}

function formatRegionalDistributionData(data: any) {
  if (!data) return null;
  return {
    regions: data.regions?.map((region: any) => ({
      name: region.name,
      totalCodes: region.totalCodes,
      verifiedCodes: region.verifiedCodes,
      activeUsers: region.activeUsers,
      fraudRate: region.fraudRate
    })) || []
  };
}

function generateCSVContent(data: any): string {
  const rows: string[] = [];
  
  // Add metadata
  rows.push('Metadata');
  rows.push(`Exported At,${data.metadata.exportedAt}`);
  rows.push(`Exported By,${data.metadata.exportedBy}`);
  rows.push(`Version,${data.metadata.version}`);
  rows.push('');

  // Add code submission data
  rows.push('Code Submission Summary');
  rows.push('Metric,Value');
  if (data.data.code_submission?.summary) {
    Object.entries(data.data.code_submission.summary).forEach(([key, value]) => {
      rows.push(`${key},${value}`);
    });
  }
  rows.push('');

  // Add user engagement data
  rows.push('User Engagement Summary');
  rows.push('Metric,Value');
  if (data.data.user_engagement?.summary) {
    Object.entries(data.data.user_engagement.summary).forEach(([key, value]) => {
      rows.push(`${key},${value}`);
    });
  }
  rows.push('');

  // Add fraud detection data
  rows.push('Fraud Detection Summary');
  rows.push('Metric,Value');
  if (data.data.fraud_detection?.summary) {
    Object.entries(data.data.fraud_detection.summary).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          rows.push(`${key}_${subKey},${subValue}`);
        });
      } else {
        rows.push(`${key},${value}`);
      }
    });
  }
  rows.push('');

  // Add regional distribution data
  rows.push('Regional Distribution');
  rows.push('Region,Total Codes,Verified Codes,Active Users,Fraud Rate');
  if (data.data.regional_distribution?.regions) {
    data.data.regional_distribution.regions.forEach((region: any) => {
      rows.push(`${region.name},${region.totalCodes},${region.verifiedCodes},${region.activeUsers},${region.fraudRate}`);
    });
  }

  return rows.join('\n');
} 