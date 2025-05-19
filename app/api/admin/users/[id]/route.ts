import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
// Remove Prisma import
// import { prisma } from '@/lib/prisma';
// Import Mongoose tools
import dbConnect from '../../../../lib/dbConnect';
import UserModel from '@/models/User'; // Assuming path is correct
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest, // Use NextRequest
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }
    
    await dbConnect();

    const user = await UserModel.findById(params.id)
      .select('_id name email role isAdmin coins permissions lastLogin createdAt') // Select fields
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map _id to id for consistency
    const formattedUser = { ...user, id: user._id.toString() };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest, // Use NextRequest
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    const data = await request.json();
    
    // Prevent updating certain fields directly via PATCH
    delete data._id;
    delete data.id;
    delete data.createdAt;
    delete data.lastLogin;
    delete data.email; // Usually email shouldn't be changed directly here
    delete data.password; // Password changes should have a separate mechanism

    // Ensure isAdmin syncs with role
    if (data.role) {
        data.isAdmin = data.role === 'admin';
    }

    await dbConnect();

    const updatedUser = await UserModel.findByIdAndUpdate(
      params.id,
      { $set: data },
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validations
        select: '_id name email role isAdmin coins permissions lastLogin createdAt' // Select fields to return
      }
    ).lean();

    if (!updatedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Map _id to id for consistency
    const formattedUser = { ...updatedUser, id: updatedUser._id.toString() };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error updating user:', error);
     if (error instanceof mongoose.Error.ValidationError) {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
     }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, // Use NextRequest
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

     if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    await dbConnect();

    // Prevent deleting the user if they are the only admin
    const userToDelete = await UserModel.findById(params.id).select('role');
    if (!userToDelete) {
         return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToDelete.role === 'admin') {
        const adminCount = await UserModel.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            return NextResponse.json({ error: 'Cannot delete the last admin user' }, { status: 400 });
        }
    }

    const deleteResult = await UserModel.findByIdAndDelete(params.id);

    if (!deleteResult) {
        // Should have been caught by the findById check, but double-check
        return NextResponse.json({ error: 'User not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 