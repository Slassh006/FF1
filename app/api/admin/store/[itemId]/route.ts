import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import StoreItemModel, { IStoreItem } from '@/models/StoreItem';
import mongoose from 'mongoose';

interface Params {
  params: { itemId: string };
}

// Helper function to check admin status
async function isAdmin(request: NextRequest): Promise<{ session: any; isAdmin: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return { session: null, isAdmin: false };
  }
  return { session, isAdmin: true };
}

// GET /api/admin/store/[itemId] - Fetch a single store item
export async function GET(request: NextRequest, { params }: Params) {
  const { isAdmin: userIsAdmin } = await isAdmin(request);
  if (!userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { itemId } = params;

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    const item = await StoreItemModel.findById(itemId);

    if (!item) {
      return NextResponse.json({ error: 'Store item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('[Admin Store GET Single Error]', error);
    return NextResponse.json({ error: 'Failed to fetch store item' }, { status: 500 });
  }
}

// PUT /api/admin/store/[itemId] - Update a store item
export async function PUT(request: NextRequest, { params }: Params) {
  const { isAdmin: userIsAdmin } = await isAdmin(request);
  if (!userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { itemId } = params;

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    const body = await request.json() as Partial<IStoreItem>;

    // Find and update the item
    // new: true returns the modified document
    // runValidators: true ensures schema validations are run on update
    const updatedItem = await StoreItemModel.findByIdAndUpdate(
      itemId,
      {
        // Only update fields provided in the body
        // Ensure category-specific fields are handled correctly
        ...body,
        redeemCode: body.category === 'Redeem Codes' ? body.redeemCode : undefined,
        rewardDetails: body.category === 'Digital Rewards' ? body.rewardDetails : undefined,
        // Ensure isActive is explicitly handled if provided
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
      { new: true, runValidators: true, omitUndefined: true } // omitUndefined prevents overwriting fields with undefined
    );

    if (!updatedItem) {
      return NextResponse.json({ error: 'Store item not found' }, { status: 404 });
    }

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('[Admin Store PUT Error]', error);
     if (error instanceof mongoose.Error.ValidationError) {
        return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
     let errorMessage = 'Failed to update store item';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/admin/store/[itemId] - Delete a store item
export async function DELETE(request: NextRequest, { params }: Params) {
  const { isAdmin: userIsAdmin } = await isAdmin(request);
  if (!userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { itemId } = params;

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedItem = await StoreItemModel.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return NextResponse.json({ error: 'Store item not found' }, { status: 404 });
    }

    // Optional: Add logic here to handle related data if needed (e.g., remove from carts?)

    return NextResponse.json({ message: 'Store item deleted successfully' });

  } catch (error) {
    console.error('[Admin Store DELETE Error]', error);
     let errorMessage = 'Failed to delete store item';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 