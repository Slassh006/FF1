import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import UserModel from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { validateEmail } from '@/lib/validation'; // Assuming you have email validation
import mongoose from 'mongoose';
import Setting from '@/models/Setting'; // Import Setting model
import { sendMail } from '@/lib/nodemailer'; // Import sendMail utility
import { getTurnstileSettings } from '@/lib/turnstileSettingsCache';

// Constants for Anti-Fraud
const REFERRAL_IP_CHECK_HOURS = 24;

// Simple email validation regex (adjust as needed)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyTurnstileToken(token: string) {
  const settings = getTurnstileSettings();
  
  // If no secret key is provided or Turnstile is disabled, accept development token
  if (!settings.secretKey || !settings.enabled) {
    console.warn('Turnstile secret key not found or disabled. Skipping verification.');
    return token === 'development-mode-token';
  }

  const formData = new URLSearchParams();
  formData.append('secret', settings.secretKey);
  formData.append('response', token);

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const outcome = await result.json();
  return outcome.success;
}

export async function POST(request: NextRequest) {
    await dbConnect();

    try {
        // --- Fetch Referral Reward Setting --- 
        let referralRewardValue = 0; // Default to 0 if setting not found or invalid
        try {
            const rewardSetting = await Setting.findOne({ key: 'referralCoinReward' });
            if (rewardSetting && typeof rewardSetting.value === 'number' && rewardSetting.value >= 0) {
                referralRewardValue = rewardSetting.value;
            } else {
                console.warn('Referral reward setting not found or invalid. Defaulting to 0.');
            }
        } catch (settingError) {
            console.error('Error fetching referral reward setting:', settingError);
            // Continue with default value 0
        }

        const { name, email, password, turnstileToken } = await request.json();
        const settings = getTurnstileSettings();

        // Validate required fields (only if Turnstile is enabled)
        if (settings.enabled && !turnstileToken) {
            return NextResponse.json({ error: 'Missing security verification' }, { status: 400 });
        }

        // Verify Turnstile token only if enabled
        if (settings.enabled) {
            const isValidToken = await verifyTurnstileToken(turnstileToken);
            if (!isValidToken) {
                return NextResponse.json({ error: 'Invalid security verification' }, { status: 400 });
            }
        }

        // --- Direct Validation --- 
        if (!EMAIL_REGEX.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        // --- Get IP and User Agent --- 
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                          request.headers.get('x-real-ip') || 
                          request.headers.get('remote-addr') || // Fallback
                          'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        console.log(`Registration attempt from IP: ${ipAddress}, UA: ${userAgent}`);

        // --- Anti-Fraud: Check Existing Email --- 
        const existingUserByEmail = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        // --- Transaction Logic Removed --- 
        let newUser = null;
        let registrationResult: { user?: any; error?: string } = {};

        // await mongoSession.withTransaction(async (sess) => { // Removed transaction wrapper
            // --- Create New User --- 
            newUser = new UserModel({
                name,
                email: email.toLowerCase(),
                password: password, 
                role: 'subscriber',
                isAdmin: false,
                coins: 0, // Start with 0 coins
                emailVerified: false, // Set to false initially
                isActive: true, // Keep active, but requires verification for full features
                referredBy: null, // Ensure it's null
                activityLog: [{
                    type: 'register', // Changed from ternary
                    details: { /* refCode: referralCode?.toUpperCase(), referrerId: referrer ? referrer._id.toString() : null */ }, // Removed referral details
                    ip: ipAddress,
                    userAgent: userAgent,
                    createdAt: new Date()
                }]
            });
            // Save the user first to get the _id
            console.log(`[Register API] Attempting initial save for user: ${newUser.email}`); // Log before save
            await newUser.save(); // Removed { session: sess }
            console.log(`[Register API] Initial save successful for user: ${newUser.email}, ID: ${newUser._id}`); // Log after save

            // --- START: Promote first user to admin --- 
            try {
              const userCount = await UserModel.countDocuments({});
              if (userCount === 1) {
                newUser.role = 'admin';
                newUser.isAdmin = true;
                console.log(`[Register API] Attempting admin promotion save for user: ${newUser.email}`); // Log before save
                await newUser.save(); // Save the updated role
                console.log(`[Register API] Admin promotion save successful for user: ${newUser.email}`); // Log after save
                console.log(`First registered user (${newUser.email}) automatically promoted to admin.`);
              }
            } catch (countError) {
              console.error('Error checking user count for admin promotion:', countError);
              // Continue registration even if count check fails
            }
            // --- END: Promote first user to admin --- 

            // --- Generate Verification Token & Send Email --- 
            let verificationToken = null;
            try {
                verificationToken = await newUser.generateEmailVerificationToken();
                // generateEmailVerificationToken method already saves the user with the token
            } catch (tokenError) {
                console.error(`Failed to generate verification token for ${newUser.email}:`, tokenError);
                // If token generation fails, we might want to delete the user or flag them
                // For now, let registration proceed but log the error
            }

            if (verificationToken) {
                const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
                const emailHtml = `<p>Hi ${newUser.name},</p>
                                 <p>Thanks for registering! Please verify your email address by clicking the link below:</p>
                                 <p><a href="${verificationUrl}" target="_blank">Verify Email Address</a></p>
                                 <p>If you did not sign up, please ignore this email.</p>`;
                const emailText = `Hi ${newUser.name},\n\nThanks for registering! Please verify your email address by visiting the following link:\n${verificationUrl}\n\nIf you did not sign up, please ignore this email.`;

                const mailResult = await sendMail({
                    to: newUser.email,
                    subject: 'Verify Your Email Address',
                    text: emailText,
                    html: emailHtml,
                });
                if (!mailResult.success) {
                     console.error(`Failed to send verification email to ${newUser.email}:`, mailResult.error);
                     // Decide how to handle: Log, maybe notify admin, maybe inform user (though they can request again)
                     // For now, we let registration proceed, but verification won't happen automatically via email
                }
            }
            // --- End Email Sending --- 

            registrationResult = { user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } };
        // }); // Removed transaction wrapper end

        return NextResponse.json({
             ...registrationResult.user, 
             message: 'Registration successful! Please check your email to verify your account.' 
        }, { status: 201 });

    } catch (error) {
        // --- ADDED DETAILED ERROR LOGGING --- 
        console.error('[API Register POST Error] Detailed:', error);
        // --------------------------------------
        console.error('[API Register POST Error]', error);
        let errorMessage = 'Registration failed. Please try again.';
        let statusCode = 500;
        if (error instanceof Error) {
             errorMessage = error.message;
             if (errorMessage.startsWith('User with this email')) { 
                 statusCode = 400;
             } 
        }
         if (error instanceof mongoose.Error.ValidationError) {
             statusCode = 400;
             errorMessage = 'Validation Error';
         }
        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
} 