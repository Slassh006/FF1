import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';

export async function GET(request: NextRequest) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const user = await User.findById(userId)
           // Select only the fields needed for the settings page
           .select('name email avatar referredBy preferences notificationPreferences socialLinks') 
           .lean(); // Use lean for potentially better performance

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return only necessary, non-sensitive data
        const settingsData = {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            referredBy: user.referredBy || null, // Ensure it's null if missing
            preferences: user.preferences || { theme: 'dark', language: 'en', timezone: 'UTC' }, // Provide defaults
            notificationPreferences: user.notificationPreferences || { email: true, inApp: true, push: false }, // Provide defaults
            socialLinks: user.socialLinks || { facebook: '', twitter: '', instagram: '', youtube: '' } // Provide defaults
            // Do NOT return password hash, tokens, etc.
        };

        return NextResponse.json(settingsData);

    } catch (error) {
        console.error('[API Get Settings Data Error]', error);
        return NextResponse.json({ error: 'Failed to fetch settings data' }, { status: 500 });
    }
} 