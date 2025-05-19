import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import Notification from '@/app/models/Notification';
import mongoose from 'mongoose';
import { ApiError } from '@/app/lib/api';

// --- GET /api/notifications/list (Fetch User's Notifications) ---
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        await connectDB();

        // --- Pagination & Filtering Params (Example) ---
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const filter = searchParams.get('filter'); // e.g., 'read', 'unread'
        const searchQuery = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        const query: mongoose.FilterQuery<typeof Notification> = { userId };

        if (filter === 'read') query.read = true;
        if (filter === 'unread') query.read = false;
        if (searchQuery) {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { message: { $regex: searchQuery, $options: 'i' } },
            ];
        }
        
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 }) // Sort by most recent
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean for performance

        const totalNotifications = await Notification.countDocuments(query);

        return NextResponse.json({
            success: true,
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalNotifications / limit),
                totalItems: totalNotifications,
            },
        });

    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// --- POST /api/notifications/mark-read (Mark as Read) ---
// Using POST for simplicity, could be PATCH
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const { notificationId, markAll } = await req.json();
        await connectDB();

        if (markAll) {
            // Mark all user's unread notifications as read
            await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
            return NextResponse.json({ success: true, message: 'All notifications marked as read.' });
        } else if (notificationId && mongoose.Types.ObjectId.isValid(notificationId)) {
            // Mark a specific notification as read
            const result = await Notification.updateOne(
                { _id: notificationId, userId }, // Ensure user owns the notification
                { $set: { read: true } }
            );
            if (result.matchedCount === 0) {
                 return NextResponse.json({ error: 'Notification not found or you do not own it.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, message: 'Notification marked as read.' });
        } else {
            return NextResponse.json({ error: 'Invalid request. Provide notificationId or markAll.' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }
}

// --- DELETE /api/notifications/delete (Delete Notification(s)) ---
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        // Get notificationId or deleteAll flag from query params for DELETE
        const { searchParams } = new URL(req.url);
        const notificationId = searchParams.get('notificationId');
        const deleteAll = searchParams.get('deleteAll') === 'true';

        await connectDB();

        if (deleteAll) {
            // Delete all user's notifications
            await Notification.deleteMany({ userId });
            return NextResponse.json({ success: true, message: 'All notifications deleted.' });
        } else if (notificationId && mongoose.Types.ObjectId.isValid(notificationId)) {
            // Delete a specific notification
            const result = await Notification.deleteOne({ _id: notificationId, userId }); // Ensure user owns it
            if (result.deletedCount === 0) {
                 return NextResponse.json({ error: 'Notification not found or you do not own it.' }, { status: 404 });
            }
            return NextResponse.json({ success: true, message: 'Notification deleted.' });
        } else {
            return NextResponse.json({ error: 'Invalid request. Provide notificationId or deleteAll=true query param.' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }
}

// --- GET /api/notifications/unread-count ---
// Separate file/route recommended, but added here for simplicity
// Create file at app/api/notifications/unread-count/route.ts
/*
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        await connectDB();
        const unreadCount = await Notification.countDocuments({ userId, read: false });
        return NextResponse.json({ success: true, unreadCount });
    } catch (error: any) {
        console.error('Error fetching unread notification count:', error);
        return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
    }
}
*/ 