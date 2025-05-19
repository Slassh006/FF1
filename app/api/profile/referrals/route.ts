import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const userId = session.user.id;

    // Find users who were referred by the current user
    const referredUsers = await User.find({ referredBy: userId })
      .select('name email avatar createdAt') // Select fields needed for display
      .sort({ createdAt: -1 })
      .lean(); // Use lean for performance

    // Adjust the response key
    return NextResponse.json({ success: true, referredUsers: referredUsers });

  } catch (error: any) {
    console.error('Error fetching referred users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data', details: error.message },
      { status: 500 }
    );
  }
} 