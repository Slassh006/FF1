import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import { User, IUser } from '@/app/models/User';
// import Submission from '@/models/Submission'; // Reverted
// import Order from '@/models/Order'; // Reverted
// Submission model import removed - Keeping original comments 
// Order model import removed - Keeping original comments

interface UserOverview {
    coins: number;
    createdAt: Date;
    avatar?: string;
    avatarLastUpdatedAt?: Date;
}

export async function GET() {
    try {
    const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

        await dbConnect();

        const userId = session.user.id;
        const userDoc = await User.findById(userId)
            .select('coins createdAt avatar avatarLastUpdatedAt')
            .lean() as UserOverview | null;

        if (!userDoc) {
             return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Fetch counts separately
        const referralsCount = await User.countDocuments({ referredBy: userId });
        const submissionsCount = 0; // Placeholder
        const ordersCount = 0; // Placeholder
        // const submissionsCount = await Submission.countDocuments({ userId: userId }); // Reverted
        // const ordersCount = await Order.countDocuments({ userId: userId }); // Reverted

        const overviewData = {
            coinBalance: userDoc.coins ?? 0, 
            joinDate: userDoc.createdAt ?? null,
            referralsCount: referralsCount ?? 0,
            submissionsCount: submissionsCount,
            ordersCount: ordersCount,
            avatar: userDoc.avatar ?? null,
            avatarLastUpdatedAt: userDoc.avatarLastUpdatedAt ?? null,
        };

        return NextResponse.json(overviewData);

    } catch (error) {
        console.error('Error fetching profile overview data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch overview data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 