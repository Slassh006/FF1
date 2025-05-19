import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
    console.log(`[Verify Email API] Received request for URL: ${request.url}`);
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        console.log('[Verify Email API] Token missing, redirecting to failure...');
        return NextResponse.redirect(new URL('/verification-failed?error=missing_token', request.url));
    }

    try {
        console.log(`[Verify Email API] Searching for user with token: ${token}`);
        // Find user by the verification token
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpiry: { $gt: Date.now() }, // Check if token is not expired
        });

        if (!user) {
            // Check if the token exists at all, even if expired, for better logging
            const expiredOrInvalidUser = await User.findOne({ emailVerificationToken: token });
            if (expiredOrInvalidUser) {
                console.warn(`[Verify Email API] Verification token expired for token: ${token}, User: ${expiredOrInvalidUser.email}`);
            } else {
                console.warn(`[Verify Email API] Verification token not found: ${token}`);
            }
            console.log('[Verify Email API] Token invalid or expired, redirecting to failure...');
            return NextResponse.redirect(new URL('/verification-failed?error=invalid_token', request.url));
        }
        console.log(`[Verify Email API] Found user: ${user.email}`);

        // Prevent processing if already verified (e.g., link clicked twice)
        if (user.emailVerified) {
            console.log(`[Verify Email API] User ${user.email} already verified, redirecting to success...`);
            return NextResponse.redirect(new URL('/verification-success', request.url));
        }

        // Mark user as verified and clear token fields
        console.log(`[Verify Email API] Marking user ${user.email} as verified...`);
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;
        
        // Log activity and Save
        if (typeof user.logActivity === 'function') {
            console.log('[Verify Email API] Logging activity and saving...');
            await user.logActivity('email_verified'); 
        } else {
            console.log('[Verify Email API] Saving user directly (no logActivity)...');
            await user.save(); 
        }

        console.log(`[Verify Email API] Verification successful for ${user.email}, redirecting to success...`);
        // Redirect to a success page
        return NextResponse.redirect(new URL('/verification-success', request.url));

    } catch (error) {
        console.error('[Verify Email API] Error during verification process:', error);
        console.log('[Verify Email API] Error occurred, redirecting to failure...');
        return NextResponse.redirect(new URL('/verification-failed?error=server_error', request.url));
    }
    // Added a fallback return just in case (shouldn't be reached)
    console.error('[Verify Email API] Reached end of function unexpectedly!');
    return NextResponse.redirect(new URL('/verification-failed?error=unexpected_flow', request.url));
} 