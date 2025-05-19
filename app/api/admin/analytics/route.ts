import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/lib/db';
import Analytics, { IAnalytics } from '../../../models/Analytics';

// Cache analytics data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let cachedData: any = null;
let lastFetchTime = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if cached data is still valid
    const now = Date.now();
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
      return NextResponse.json(cachedData);
    }

    await connectDB();

    const analyticsData: Partial<Record<IAnalytics['type'], IAnalytics['data']>> = {};

    // Fetch latest analytics for each type
    const types: IAnalytics['type'][] = [
      'code_submission',
      'user_engagement',
      'fraud_detection',
      'regional_distribution'
    ];

    for (const type of types) {
      const latest = await Analytics.findOne({ type })
        .sort({ createdAt: -1 })
        .select('data -_id')
        .lean<Pick<IAnalytics, 'data'>>();

      if (latest) {
        analyticsData[type] = latest.data;
      }
    }

    // Prepare response data
    const responseData = {
      ...analyticsData,
      lastUpdated: new Date().toISOString()
    };

    // Update cache
    cachedData = responseData;
    lastFetchTime = now;

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
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
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 