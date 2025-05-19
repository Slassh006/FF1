import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { email, inApp, push } = body;

    // Validate input
    if (typeof email !== 'boolean' || typeof inApp !== 'boolean' || typeof push !== 'boolean') {
      return NextResponse.json({ error: 'Invalid notification preferences' }, { status: 400 });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { 
        notificationPreferences: {
          email,
          inApp,
          push
        }
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error: any) {
    console.error('Notification preferences update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
} 