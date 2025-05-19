import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { validateEmail } from '@/lib/validation';
import { isRateLimited } from '@/lib/validation';
import { sendEmail } from '@/lib/email';

// Rate limiting settings
const MAX_RESET_ATTEMPTS = 3;
const RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Please provide an email address' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      await user.logActivity('password_reset_blocked', {
        reason: 'User is blocked',
        ip: req.ip,
        userAgent: req.headers.get('user-agent')
      });
      return NextResponse.json(
        { error: 'Your account has been blocked. Please contact support.' },
        { status: 403 }
      );
    }

    // Check rate limiting
    const lastResetAttempt = user.lastResetAttempt || 0;
    const resetAttempts = user.resetAttempts || 0;
    
    if (isRateLimited(resetAttempts, MAX_RESET_ATTEMPTS, RESET_WINDOW_MS, lastResetAttempt)) {
      await user.logActivity('password_reset_rate_limited', {
        attempts: resetAttempts,
        ip: req.ip,
        userAgent: req.headers.get('user-agent')
      });
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate reset token
    const resetToken = await user.generateResetToken();
    
    // Update reset attempt tracking
    user.resetAttempts = resetAttempts + 1;
    user.lastResetAttempt = Date.now();
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send email using our email service
    await sendEmail(user.email, 'resetPassword', {
      name: user.name,
      resetUrl
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request. Please try again.' },
      { status: 500 }
    );
  }
} 