import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

interface IUser {
  name: string;
  email: string;
  avatar?: string;
  socialLinks?: Record<string, string>;
  preferences?: {
    language: string;
    timezone: string;
  };
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    // --- DEBUG LOGGING START ---
    console.log('[API /profile/update] Received data:', JSON.stringify(data, null, 2));
    // --- DEBUG LOGGING END ---

    // Validate input
    if (!data.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Update user
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          name: data.name,
          avatar: data.avatar,
          socialLinks: data.socialLinks || {},
          preferences: {
            language: data.preferences?.language || 'en',
            timezone: data.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          notificationPreferences: {
            email: data.notificationPreferences?.email ?? true,
            inApp: data.notificationPreferences?.inApp ?? true,
            push: data.notificationPreferences?.push ?? false
          }
        }
      },
      { new: true }
    ) as IUser | null;

    // --- DEBUG LOGGING START ---
    if (user) {
      console.log('[API /profile/update] User object AFTER update:', JSON.stringify(user, null, 2));
    } else {
      console.log('[API /profile/update] User not found after update attempt.');
    }
    // --- DEBUG LOGGING END ---

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        socialLinks: user.socialLinks,
        preferences: user.preferences,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
} 