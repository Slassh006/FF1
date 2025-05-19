import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/models/User';

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { name, email, avatar, referralCode } = await request.json();

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update user profile
        user.name = name;
        user.email = email;
        if (avatar) user.avatar = avatar;
        if (referralCode) user.referralCode = referralCode;

        await user.save();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 