import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import CraftlandCode from '@/app/models/CraftlandCode';
import { ApiError } from '@/app/lib/api';
import { Types } from 'mongoose';

const VOTE_THRESHOLD = 10; // Number of votes needed for verification
const VOTE_COOLDOWN = 5 * 60 * 1000; // 5 minutes

// POST /api/craftland-codes/[id]/vote
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;
  const { vote } = await request.json();

  if (!['up', 'down'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
  }

  try {
    await connectDB();
    const craftlandCode = await CraftlandCode.findById(params.id);

    if (!craftlandCode) {
      throw new ApiError(404, 'Craftland code not found');
    }

    // Check if user has voted recently
    const recentVotes = await CraftlandCode.find({
      $or: [
        { upvotes: userId },
        { downvotes: userId }
      ],
      createdAt: { $gte: new Date(Date.now() - VOTE_COOLDOWN) }
    });

    if (recentVotes.length > 0) {
      throw new ApiError(429, 'Please wait before voting again');
    }

    // Remove existing vote if any
    craftlandCode.upvotes = craftlandCode.upvotes.filter((id: Types.ObjectId) => id.toString() !== userId);
    craftlandCode.downvotes = craftlandCode.downvotes.filter((id: Types.ObjectId) => id.toString() !== userId);

    // Add new vote
    if (vote === 'up') {
      craftlandCode.upvotes.push(userId);
    } else {
      craftlandCode.downvotes.push(userId);
    }

    // Check if code should be verified based on votes
    const netVotes = craftlandCode.upvotes.length - craftlandCode.downvotes.length;
    if (netVotes >= VOTE_THRESHOLD && !craftlandCode.isVerified) {
      craftlandCode.isVerified = true;
    }

    await craftlandCode.save();

    return NextResponse.json({
      success: true,
      isVerified: craftlandCode.isVerified,
      upvotes: craftlandCode.upvotes.length,
      downvotes: craftlandCode.downvotes.length,
      netVotes
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
} 