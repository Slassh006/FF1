import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select('downloads likes favorites coins referrals withdrawals')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate statistics
    const stats = {
      totalDownloads: user.downloads?.length || 0,
      totalLikes: user.likes?.length || 0,
      totalFavorites: user.favorites?.length || 0,
      coins: user.coins || 0,
      referrals: user.referrals?.length || 0,
      withdrawals: user.withdrawals?.length || 0,
      // Add more statistics as needed
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Profile stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile statistics' },
      { status: 500 }
    );
  }
} 