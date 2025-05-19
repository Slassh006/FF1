import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import StoreItemModel, { IStoreItem } from '@/models/StoreItem';
import mongoose from 'mongoose';

// Helper function to check admin status
async function isAdmin(request: NextRequest): Promise<{ session: any; isAdmin: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return { session: null, isAdmin: false };
  }
  return { session, isAdmin: true };
}

// GET /api/admin/store - Fetch all store items (for admin)
export async function GET(request: NextRequest) {
  const { isAdmin: userIsAdmin } = await isAdmin(request);
  if (!userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    // TODO: Add pagination, sorting, filtering later if needed
    const items = await StoreItemModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error('[Admin Store GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch store items' }, { status: 500 });
  }
}

// POST /api/admin/store - Create a new store item
export async function POST(request: NextRequest) {
  const { isAdmin: userIsAdmin } = await isAdmin(request);
  if (!userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await request.json() as Partial<IStoreItem>;

    // Basic validation (more specific validation can be added)
    if (!body.name || !body.description || !body.category || body.coinCost === undefined || body.coinCost < 0) {
        return NextResponse.json({ error: 'Missing required fields or invalid coin cost' }, { status: 400 });
    }

    const newItem = new StoreItemModel({
        name: body.name,
        description: body.description,
        category: body.category,
        coinCost: body.coinCost,
        imageUrl: body.imageUrl,
        redeemCode: body.category === 'Redeem Codes' ? body.redeemCode : undefined,
        rewardDetails: body.category === 'Digital Rewards' ? body.rewardDetails : undefined,
        inventory: body.inventory, // Allows null for infinite
        isActive: body.isActive !== undefined ? body.isActive : true, // Default to active
    });

    const savedItem = await newItem.save();
    return NextResponse.json(savedItem, { status: 201 });

  } catch (error) {
    console.error('[Admin Store POST Error]', error);
    // Check specifically for Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
        // Access the specific validation error messages
        return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    // Handle other potential errors
    let errorMessage = 'Failed to create store item';
    if (error instanceof Error) {
        errorMessage = error.message; // Use specific error message if available
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 