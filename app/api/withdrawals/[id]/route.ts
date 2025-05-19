import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import Withdrawal from '@/models/Withdrawal';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

// GET /api/withdrawals/[id] - Get a specific withdrawal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const withdrawal = await Withdrawal.findById(params.id)
      .populate('user', 'name email')
      .populate('approvedBy', 'name email');

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this withdrawal
    if (
      withdrawal.user._id.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, withdrawal });
  } catch (error) {
    console.error('Get withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get withdrawal' },
      { status: 500 }
    );
  }
}

// PATCH /api/withdrawals/[id] - Update withdrawal status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { status, rejectionReason } = await request.json();

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    await connectDB();

    const withdrawal = await Withdrawal.findById(params.id);
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Withdrawal already processed' },
        { status: 400 }
      );
    }

    // Update withdrawal status
    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = session.user.id;
    if (rejectionReason) {
      withdrawal.rejectionReason = rejectionReason;
    }

    // If approved, update user's coins
    if (status === 'approved') {
      const user = await User.findById(withdrawal.user);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Add coins back to user's balance
      await user.addCoins(withdrawal.amount, 'withdrawal_approved');
    }

    await withdrawal.save();

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${status} successfully`,
      withdrawal,
    });
  } catch (error) {
    console.error('Update withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}

// DELETE /api/withdrawals/[id] - Delete a withdrawal (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const withdrawal = await Withdrawal.findById(params.id);
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending withdrawals
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Can only delete pending withdrawals' },
        { status: 400 }
      );
    }

    await withdrawal.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Withdrawal deleted successfully',
    });
  } catch (error) {
    console.error('Delete withdrawal error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete withdrawal' },
      { status: 500 }
    );
  }
} 