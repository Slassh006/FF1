import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/lib/db';
import Analytics, { IAnalytics, IAnalyticsModel } from '../../../../models/Analytics';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      );
    }

    if (!['code_submission', 'user_engagement', 'fraud_detection', 'regional_distribution'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid analytics type' },
        { status: 400 }
      );
    }

    // Validate data structure based on type
    const validationErrors = validateAnalyticsData(type, data);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid data structure', details: validationErrors },
        { status: 400 }
      );
    }

    const AnalyticsModel = Analytics as unknown as IAnalyticsModel;
    const result = await AnalyticsModel.updateAnalytics(type, data);

    return NextResponse.json({
      success: true,
      message: 'Analytics updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating analytics:', error);
    
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
        error: 'Failed to update analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function validateAnalyticsData(type: string, data: any): string[] {
  const errors: string[] = [];

  switch (type) {
    case 'code_submission':
      if (!data.submissions) {
        errors.push('Missing submissions data');
      } else {
        const { total, verified, pending, rejected, fraudulent, daily, hourly } = data.submissions;
        if (typeof total !== 'number') errors.push('Invalid total submissions count');
        if (typeof verified !== 'number') errors.push('Invalid verified submissions count');
        if (typeof pending !== 'number') errors.push('Invalid pending submissions count');
        if (typeof rejected !== 'number') errors.push('Invalid rejected submissions count');
        if (typeof fraudulent !== 'number') errors.push('Invalid fraudulent submissions count');
        if (!Array.isArray(daily)) errors.push('Invalid daily submissions data');
        if (!Array.isArray(hourly)) errors.push('Invalid hourly submissions data');
      }
      break;

    case 'user_engagement':
      if (!data.engagement) {
        errors.push('Missing engagement data');
      } else {
        const { totalUsers, activeUsers, averageVotesPerUser, averageSubmissionsPerUser, userRetention } = data.engagement;
        if (typeof totalUsers !== 'number') errors.push('Invalid total users count');
        if (typeof activeUsers !== 'number') errors.push('Invalid active users count');
        if (typeof averageVotesPerUser !== 'number') errors.push('Invalid average votes per user');
        if (typeof averageSubmissionsPerUser !== 'number') errors.push('Invalid average submissions per user');
        if (!Array.isArray(userRetention)) errors.push('Invalid user retention data');
      }
      break;

    case 'fraud_detection':
      if (!data.fraud) {
        errors.push('Missing fraud detection data');
      } else {
        const { totalDetected, byType, daily, topRegions } = data.fraud;
        if (typeof totalDetected !== 'number') errors.push('Invalid total detected fraud count');
        if (typeof byType !== 'object') errors.push('Invalid fraud type data');
        if (!Array.isArray(daily)) errors.push('Invalid daily fraud data');
        if (!Array.isArray(topRegions)) errors.push('Invalid top regions data');
      }
      break;

    case 'regional_distribution':
      if (!data.regions || !Array.isArray(data.regions)) {
        errors.push('Invalid regions data');
      } else {
        data.regions.forEach((region: any, index: number) => {
          if (typeof region.name !== 'string') errors.push(`Invalid region name at index ${index}`);
          if (typeof region.totalCodes !== 'number') errors.push(`Invalid total codes at index ${index}`);
          if (typeof region.verifiedCodes !== 'number') errors.push(`Invalid verified codes at index ${index}`);
          if (typeof region.activeUsers !== 'number') errors.push(`Invalid active users at index ${index}`);
          if (typeof region.fraudRate !== 'number') errors.push(`Invalid fraud rate at index ${index}`);
        });
      }
      break;
  }

  return errors;
} 