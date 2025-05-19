import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Quiz from '@/models/Quiz';
import Wallpaper from '@/models/Wallpaper';
import Code from '@/models/Code';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    
    // Get user statistics
    const [quizzesTaken, wallpapersSaved, codesSubmitted, user] = await Promise.all([
      Quiz.countDocuments({ userId: payload.userId }),
      Wallpaper.countDocuments({ savedBy: payload.userId }),
      Code.countDocuments({ userId: payload.userId }),
      User.findById(payload.userId).select('coins referrals')
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      stats: {
        quizzesTaken,
        wallpapersSaved,
        codesSubmitted,
        coins: user.coins || 0,
        referrals: user.referrals?.length || 0
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 