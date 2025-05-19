import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import Notification from '@/app/models/Notification';
import User from '@/app/models/User'; // Need User model to find recipients
import mongoose from 'mongoose';
import { ApiError } from '@/app/lib/api';

// --- POST /api/admin/notifications/send (Admin Send Notification) ---
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    // Ensure user is logged in and is an admin
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, message, link, target, userIds } = await req.json();

        // Validate input
        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
        }
        if (target === 'specific' && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
            return NextResponse.json({ error: 'Specific user IDs must be provided for target "specific".' }, { status: 400 });
        }

        await connectDB();
        let recipientUserIds: mongoose.Types.ObjectId[] = [];

        if (target === 'all') {
            // Fetch all user IDs (consider performance for very large user bases)
            // Might need pagination or background job for huge scale
            const allUsers = await User.find({}, '_id').lean();
            recipientUserIds = allUsers.map((user: { _id: mongoose.Types.ObjectId }) => user._id);
        } else if (target === 'specific') {
            // Validate provided user IDs
            recipientUserIds = userIds
                .filter((id: any) => mongoose.Types.ObjectId.isValid(id))
                .map((id: string | mongoose.Types.ObjectId) => new mongoose.Types.ObjectId(id));
            if (recipientUserIds.length !== userIds.length) {
                console.warn('Some invalid user IDs were provided for specific notification target.');
                // Decide if this is an error or just proceed with valid ones
            }
            if (recipientUserIds.length === 0) {
                 return NextResponse.json({ error: 'No valid specific user IDs provided.' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Invalid target specified. Use "all" or "specific".' }, { status: 400 });
        }

        if (recipientUserIds.length === 0) {
             return NextResponse.json({ error: 'No recipients found for the notification.' }, { status: 400 });
        }

        // Create notification documents in bulk
        const notificationsToInsert = recipientUserIds.map((userId: mongoose.Types.ObjectId) => ({
            userId: userId,
            title: title,
            message: message,
            link: link || undefined,
            read: false,
            type: 'admin', // Mark as admin-sent
        }));

        const result = await Notification.insertMany(notificationsToInsert);

        // TODO: Trigger real-time update (e.g., WebSocket emit) if implemented

        return NextResponse.json({ success: true, message: `Notification sent to ${result.length} users.` });

    } catch (error: any) {
        console.error('Error sending admin notification:', error);
        if (error instanceof mongoose.Error.ValidationError) {
             const errors = Object.values(error.errors).map(el => el.message);
             return NextResponse.json({ error: `Validation failed: ${errors.join(', ')}` }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}

// Add GET, PUT, DELETE handlers here later if needed for managing sent admin notifications 