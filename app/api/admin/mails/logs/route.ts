import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import AdminMailLog from '@/app/models/AdminMailLog';
import { ApiError } from '@/app/lib/api';
import mongoose from 'mongoose';

// Helper: Check Admin Role
const checkAdmin = (session: any) => {
    if (!session?.user?.id || session.user.role !== 'admin') {
        throw new ApiError(401, 'Unauthorized: Admin access required');
    }
};

// --- GET /api/admin/mails/logs (List Mail Logs) ---
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    try {
        checkAdmin(session);
        await connectDB();

        // --- Pagination & Filtering Params (Example) ---
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '15', 10);
        const filterStatus = searchParams.get('status'); // 'success' or 'failed'
        const sort = searchParams.get('sort') || '-sentAt'; // Default sort by date descending
        const skip = (page - 1) * limit;

        const query: mongoose.FilterQuery<typeof AdminMailLog> = {};

        if (filterStatus === 'success') query.status = 'success';
        if (filterStatus === 'failed') query.status = 'failed';

        // Populate admin user info and template name
        const logs = await AdminMailLog.find(query)
            .populate('adminUserId', 'name email') // Populate admin who sent it
            .populate('templateUsed', 'name')     // Populate template name if used
            .sort(sort) 
            .skip(skip)
            .limit(limit)
            .lean(); 

        const totalLogs = await AdminMailLog.countDocuments(query);

        return NextResponse.json({
            success: true,
            logs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalLogs / limit),
                totalItems: totalLogs,
            },
        });

    } catch (error: any) {
        console.error('Error fetching mail logs:', error);
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: 'Failed to fetch mail logs' }, { status: 500 });
    }
} 