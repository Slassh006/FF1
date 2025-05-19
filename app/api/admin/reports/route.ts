import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/app/lib/mongodb';
import CraftlandCode from '@/app/models/CraftlandCode';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find codes with pending reports
    const reportedCodes = await CraftlandCode.find({
      'reports.status': 'pending'
    })
    .select('title code reports reportCount isFraudulent')
    .populate('reports.userId', 'name email')
    .sort({ reportCount: -1, 'reports.createdAt': -1 })
    .lean();

    return NextResponse.json({ 
      success: true, 
      reportedCodes 
    });

  } catch (error: any) {
    console.error('Error fetching reported codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reported codes' },
      { status: 500 }
    );
  }
} 