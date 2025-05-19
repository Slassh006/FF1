import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/app/lib/dbConnect';
import { authOptions } from '../[...nextauth]/options';
import { User, IUser } from '@/app/models/User';
import mongoose from 'mongoose';

// Define a type for the lean user document
type LeanUser = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: 'admin' | 'subscriber';
  isAdmin: boolean;
  avatar?: string;
  permissions: string[];
  coins: number;
};

export async function GET() {
  try {
    // Get the session using NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false });
    }

    // Get user data from database to ensure it's up to date
    await dbConnect();
    const user = await User.findById(session.user.id).select('-password').lean();

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    const typedUser = user as unknown as LeanUser;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: typedUser._id.toString(),
        name: typedUser.name,
        email: typedUser.email,
        role: typedUser.role,
        isAdmin: typedUser.isAdmin,
        avatar: typedUser.avatar,
        permissions: typedUser.permissions || [],
        coins: typedUser.coins || 0
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
} 