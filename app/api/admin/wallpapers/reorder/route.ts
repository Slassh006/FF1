import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/lib/db';
import Wallpaper from '@/app/models/Wallpaper';
import { Types } from 'mongoose';

export async function PUT(req: NextRequest) {
  try {
    // 1. Authenticate Admin User
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required.' },
        { status: 403 }
      );
    }

    // 2. Parse Request Body
    const { orderedIds } = await req.json();

    if (!Array.isArray(orderedIds) || orderedIds.some(id => !Types.ObjectId.isValid(id))) {
      return NextResponse.json(
        { error: 'Invalid input: orderedIds must be an array of valid ObjectIds.' },
        { status: 400 }
      );
    }

    // 3. Connect to Database
    await connectDB();

    // 4. Update sortOrder for each wallpaper
    const updatePromises = orderedIds.map((id, index) => 
      Wallpaper.findByIdAndUpdate(
        id,
        { $set: { sortOrder: index } }, // Set sortOrder based on array index
        { new: true } // Optional: return updated doc
      )
    );

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // 5. Return Success Response
    return NextResponse.json({
      message: 'Wallpaper order updated successfully.',
    });

  } catch (error) {
    console.error('Error updating wallpaper order:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: `Failed to update wallpaper order: ${errorMessage}` },
      { status: 500 }
    );
  }
} 