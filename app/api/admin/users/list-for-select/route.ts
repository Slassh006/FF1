import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import User from '@/models/User'; // Changed from @/app/models/User
import { ApiError } from '@/app/lib/api';
import mongoose from 'mongoose'; // Import mongoose if needed for types

// GET /api/admin/users/list-for-select
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    // Ensure user is logged in and is an admin
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectDB();

        const url = new URL(req.url);
        const searchQuery = url.searchParams.get('search');
        const limit = 20; // Limit the number of results for performance

        let query = {};
        if (searchQuery && searchQuery.trim().length > 0) {
            const regex = new RegExp(searchQuery.trim(), 'i'); // Case-insensitive regex search
            query = {
                $or: [
                    { name: { $regex: regex } },
                    { email: { $regex: regex } }
                ]
            };
        } else {
             // If no search query, return empty list - forcing search for performance
             return NextResponse.json({ success: true, users: [] });
        }

        // Fetch users matching the query
        const users = await User.find(query, '_id name email')
                                 .limit(limit) // Apply limit
                                 .sort({ name: 1, email: 1 }) // Sort results
                                 .lean();

        // Format for react-select (value/label)
        const userOptions = users.map((user: { _id: mongoose.Types.ObjectId, name?: string, email: string }) => ({
            value: user._id.toString(),
            label: user.name ? `${user.name} (${user.email})` : user.email
        }));

        return NextResponse.json({ success: true, users: userOptions });

    } catch (error: any) {
        console.error('Error fetching users for select:', error);
        return NextResponse.json({ error: 'Failed to fetch user list' }, { status: 500 });
    }
} 