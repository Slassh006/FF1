import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import OrderModel from '@/models/Order';
import mongoose from 'mongoose';

// GET /api/orders - Fetch orders for the authenticated user
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        await dbConnect();

        // Find orders for the specific user, sorted by creation date (newest first)
        const orders = await OrderModel.find({ userId: userId })
            .sort({ createdAt: -1 })
            // Select fields needed for the order list view
            // The items array already contains basic info (name, quantity, cost)
            .select('_id totalCoinCost status items createdAt') 
            .lean(); // Use lean for performance

        return NextResponse.json(orders);

    } catch (error) {
        console.error('[API Orders GET Error]', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// ... existing code ... 