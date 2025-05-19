import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/app/lib/dbConnect';
import StoreItemModel from '@/models/StoreItem';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
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

// PATCH /api/admin/store/[itemId]/toggle-active - Toggle isActive status
export async function PATCH(request: NextRequest, { params }: Params) {
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

    // Toggle the isActive status
    item.isActive = !item.isActive;
    const updatedItem = await item.save();

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('[Admin Store Toggle Active Error]', error);
    let errorMessage = 'Failed to toggle store item status';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
     if (error instanceof mongoose.Error.ValidationError) {
        return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 