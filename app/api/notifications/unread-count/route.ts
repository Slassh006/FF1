import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import { User as UserModel, IUser } from '@/app/models/User';
import mongoose from 'mongoose';

// Cache for unread counts
const unreadCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds cache

// Clean up expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    Array.from(unreadCountCache.entries()).forEach(([key, value]) => {
        if (now - value.timestamp > CACHE_DURATION) {
            unreadCountCache.delete(key);
        }
    });
}, CACHE_DURATION);

// Function to invalidate cache for a user
export function invalidateUnreadCountCache(userId: string) {
    unreadCountCache.delete(userId);
}

// GET /api/notifications/unread-count
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        // Return 0 count for unauthenticated users, or an error?
        // Let's return 0 for simplicity in the header badge
        return NextResponse.json({ success: true, unreadCount: 0 }); 
        // Alternative: return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;
    const now = Date.now();

    // Check cache first
    const cached = unreadCountCache.get(userId);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return NextResponse.json({ success: true, unreadCount: cached.count });
    }

    try {
        await dbConnect();
        
        // Convert string ID to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Use aggregation for better performance
        const result = await UserModel.aggregate([
            { $match: { _id: userObjectId } },
            { $unwind: { path: '$notifications', preserveNullAndEmptyArrays: true } },
            { $match: { 'notifications.read': false } },
            { $count: 'total' }
        ]);

        const count = result[0]?.total || 0;

        // Update cache
        unreadCountCache.set(userId, { count, timestamp: now });

        return NextResponse.json({ success: true, unreadCount: count });
    } catch (error: any) {
        console.error('Error fetching unread notification count:', error);
        return NextResponse.json({ success: false, unreadCount: 0, error: 'Failed to fetch unread count' }, { status: 500 });
    }
} 