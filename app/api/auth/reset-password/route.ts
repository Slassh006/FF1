import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { validatePassword } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Please provide both token and new password' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Your account has been blocked. Please contact support.' },
        { status: 403 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password and clear reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    user.resetAttempts = 0;
    user.lastResetAttempt = undefined;
    await user.save();

    // Send confirmation email
    await sendEmail(user.email, 'passwordChanged', {
      name: user.name
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
} 