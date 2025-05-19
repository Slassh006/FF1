import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/app/lib/dbConnect';
import { User, IUser } from '@/app/models/User';
import { sendMail } from '@/app/lib/nodemailer';
import { authOptions } from '../[...nextauth]/options';
import mongoose from 'mongoose';

// Define a type for the lean user document
type LeanUser = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
};

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    // 1. Check if user is authenticated
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        // 2. Find the authenticated user
        const user = await User.findById(session.user.id);

        if (!user) {
            console.error(`[Resend Verification] User not found for ID: ${session.user.id}`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Check if email is already verified
        if (user.emailVerified) {
            console.log(`[Resend Verification] Email already verified for user: ${user.email}`);
            return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
        }

        // 4. Generate a new verification token (method saves the user)
        console.log(`[Resend Verification] Generating new token for user: ${user.email}`);
        const verificationToken = await user.generateEmailVerificationToken();

        if (!verificationToken) {
             console.error(`[Resend Verification] Failed to generate verification token for user: ${user.email}`);
             throw new Error('Failed to generate verification token.'); // Let generic error handler catch this
        }
        
        // 5. Construct verification URL
        const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        // 6. Send the verification email
         console.log(`[Resend Verification] Sending new verification email to: ${user.email}`);
         const emailHtml = `<p>Hi ${user.name},</p>
                         <p>Please verify your email address again by clicking the link below:</p>
                         <p><a href="${verificationUrl}" target="_blank">Verify Email Address</a></p>
                         <p>This link will expire in 24 hours. If you did not request this, please ignore this email.</p>`;
         const emailText = `Hi ${user.name},\n\nPlease verify your email address again by visiting the following link:\n${verificationUrl}\n\nThis link will expire in 24 hours. If you did not request this, please ignore this email.`;

        try {
            await sendMail({
                to: user.email,
                subject: 'Resend: Verify Your Email Address',
                text: emailText,
                html: emailHtml,
            });
            
            // 7. Return Success
            console.log(`[Resend Verification] Verification email resent successfully to: ${user.email}`);
            return NextResponse.json({ success: true, message: 'Verification email has been resent. Please check your inbox.' });
        } catch (mailError) {
            console.error(`[Resend Verification] Failed to send verification email to ${user.email}:`, mailError);
            // Even if email fails, the token was generated. Return a specific error.
            return NextResponse.json({ error: 'Failed to send verification email. Please try again later.' }, { status: 500 });
        }

    } catch (error) {
        console.error('[API Resend Verification Error]', error);
        return NextResponse.json({ error: 'An error occurred while resending the verification email.' }, { status: 500 });
    }
} 