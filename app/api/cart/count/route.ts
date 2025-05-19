import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import { User as UserModel, IUser } from '@/app/models/User';
import mongoose from 'mongoose';

// Cache for cart counts
const cartCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds cache

// Clean up expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    Array.from(cartCountCache.entries()).forEach(([key, value]) => {
        if (now - value.timestamp > CACHE_DURATION) {
            cartCountCache.delete(key);
        }
    });
}, CACHE_DURATION);

// Function to invalidate cache for a user
export function invalidateCartCountCache(userId: string) {
    cartCountCache.delete(userId);
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        // Return 0 count for unauthenticated users, or null/error based on preference
        return NextResponse.json({ count: 0 }); 
    }

    const userId = session.user.id;
    const now = Date.now();

    // Check cache first
    const cached = cartCountCache.get(userId);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return NextResponse.json({ count: cached.count });
    }

    try {
        await dbConnect();

        // Convert string ID to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Use aggregation for better performance
        const result = await UserModel.aggregate([
            { $match: { _id: userObjectId } },
            { $unwind: { path: '$cart.items', preserveNullAndEmptyArrays: true } },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$cart.items.quantity', 0] } } } }
        ]);

        const count = result[0]?.total || 0;

        // Update cache
        cartCountCache.set(userId, { count, timestamp: now });

        return NextResponse.json({ count });

    } catch (error) {
        console.error('[API Cart Count GET Error]', error);
        // Return 0 or null on error to avoid breaking the UI
        return NextResponse.json({ count: null, error: 'Failed to fetch cart count' }, { status: 500 }); 
    }
} 