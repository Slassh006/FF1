import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import StoreItem from '@/models/StoreItem';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { ApiResponse } from '@/app/types/store';
import { Types } from 'mongoose';
import dbConnect from '@/app/lib/dbConnect';
import StoreItemModel from '@/models/StoreItem';
import mongoose from 'mongoose';
import UserModel from '@/models/User';

interface UserCartItem {
  itemId: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

// GET /api/store - Get all *active* store items (public)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Fetch only active items and select only necessary public fields
    const items = await StoreItemModel.find({ isActive: true })
        .select('_id name description category coinCost imageUrl inventory isActive createdAt updatedAt') // Select public fields
        // Explicitly exclude sensitive fields (although select should handle this, belt-and-suspenders)
        // .select('-redeemCode -rewardDetails') // This syntax might conflict with the positive selection above, usually one or the other.
        // Positive selection is generally preferred and safer.
        .sort({ createdAt: -1 }); // Sort by newest first
    
    // Return directly using NextResponse
    return NextResponse.json(items);

  } catch (error) {
    console.error('[Public Store GET Error]', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch store items';
    // Return standard error response
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// --- REMOVED Redundant Cart Logic Handlers --- 

/*
// PUT /api/store - (Removed) Was incorrectly handling Add/update item in cart 
export async function PUT(request: NextRequest) { 
  // ... implementation removed ...
}
*/

/*
// DELETE /api/store - (Removed) Was incorrectly handling Remove item from cart
export async function DELETE(request: NextRequest) { 
  // ... implementation removed ...
}
*/

// You might have other handlers here for ADMIN actions like creating/updating/deleting STORE ITEMS themselves.
// Keep those if they exist and are separate from cart logic. 