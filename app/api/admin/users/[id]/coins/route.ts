import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import { connectDB } from '../../../../../lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount, operation } = await request.json();

    if (!['add', 'subtract'].includes(operation) || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid operation or amount' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (operation === 'add') {
      user.coins += amount;
    } else {
      user.coins = Math.max(0, user.coins - amount);
    }

    await user.save();

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user coins:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 