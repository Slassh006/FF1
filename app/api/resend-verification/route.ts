import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { sendMail } from '@/lib/nodemailer';
import mongoose from 'mongoose';

// Optional: Add rate limiting here if desired

export async function POST(request: NextRequest) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email is already verified' }, { status: 400 }); // 400 Bad Request might be appropriate
        }

        // --- Generate NEW Verification Token & Send Email --- 
        let verificationToken = null;
        try {
            verificationToken = await user.generateEmailVerificationToken();
            // Method saves the user with the new token/expiry
        } catch (tokenError) {
            console.error(`Failed to generate new verification token for ${user.email}:`, tokenError);
            throw new Error('Failed to prepare verification. Please try again later.');
        }

        if (!verificationToken) {
             throw new Error('Could not generate verification token.');
        }

        const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        const emailHtml = `<p>Hi ${user.name},</p>
                         <p>You requested a new email verification link. Please verify your email address by clicking the link below:</p>
                         <p><a href="${verificationUrl}" target="_blank">Verify Email Address</a></p>
                         <p>If you did not request this, please ignore this email.</p>`;
        const emailText = `Hi ${user.name},\n\nYou requested a new email verification link. Please verify your email address by visiting the following link:\n${verificationUrl}\n\nIf you did not request this, please ignore this email.`;

        const mailResult = await sendMail({
            to: user.email,
            subject: 'Verify Your Email Address (New Request)',
            text: emailText,
            html: emailHtml,
        });
        
        if (!mailResult.success) {
             console.error(`Failed to resend verification email to ${user.email}:`, mailResult.error);
             throw new Error('Failed to send verification email. Please try again later.');
        }

        return NextResponse.json({ success: true, message: 'New verification email sent. Please check your inbox.' });

    } catch (error) {
        console.error('[API Resend Verification POST Error]', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 