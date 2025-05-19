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
    const { theme, fontSize } = body;

    // Validate input
    if (theme && !['dark', 'light'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    if (fontSize && !['small', 'medium', 'large'].includes(fontSize)) {
      return NextResponse.json({ error: 'Invalid font size' }, { status: 400 });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { 
        appearance: {
          theme: theme || 'dark',
          fontSize: fontSize || 'medium'
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
    console.error('Appearance update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update appearance settings' },
      { status: 500 }
    );
  }
} 