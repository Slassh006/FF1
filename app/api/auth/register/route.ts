import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Settings from '@/models/Setting';
import { validateEmail, validatePassword, validateName } from '@/lib/validation';
import mongoose from 'mongoose';

// Function to safely get the referral reward setting
async function getReferralReward(): Promise<number> {
  try {
    await connectDB();
    const setting = await Settings.findOne({ key: 'referralCoinReward' });
    if (setting && typeof setting.value === 'number' && setting.value >= 0) {
      return Math.floor(setting.value);
    }
  } catch (error) {
    console.error("Error fetching referralCoinReward setting:", error);
  }
  return 1; // Default reward if setting not found or invalid
}

export async function POST(req: NextRequest) {
  let referralAwardedToNewUser = false; // Flag to return
  try {
    const { name, email, password, referralCode } = await req.json();
    const lowerCaseEmail = email.toLowerCase();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!validateName(name) || !validateEmail(lowerCaseEmail) || !validatePassword(password)) {
      return NextResponse.json({ error: 'Invalid name, email, or password format/strength.' }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // --- Referral Pre-checks (before creating user) ---
    let referrer = null;
    let validReferralCode = null;
    if (referralCode && typeof referralCode === 'string') {
        validReferralCode = referralCode.trim().toUpperCase();
        if (validReferralCode) {
            referrer = await User.findOne({ referralCode: validReferralCode }).select('_id email addCoins referralCount');
            if (referrer) {
                if (referrer.email === lowerCaseEmail) {
                    console.warn(`Self-referral attempt: ${lowerCaseEmail}`);
                    referrer = null;
                    validReferralCode = null;
                } else {
                     console.log(`Referrer ${referrer.email} found for code ${validReferralCode}`);
                }
            } else {
                console.warn(`Referral code ${validReferralCode} invalid.`);
                validReferralCode = null;
            }
        }
    }
    // --- End Referral Pre-checks ---

    // Check if user already exists (after potential referrer check)
    const existingUser = await User.findOne({ email: lowerCaseEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Create new user instance
    const user = new User({
      name,
      email: lowerCaseEmail,
      password,
      role: 'subscriber',
      isAdmin: false,
      coins: 0,
      appliedReferrals: []
    });

    // --- Process Valid Referral *Before* Save ---
    let rewardAmount = 0;
    if (referrer && validReferralCode) {
        rewardAmount = await getReferralReward();

        user.appliedReferrals.push({
            referrerId: referrer._id,
            codeUsed: validReferralCode,
            appliedAt: new Date()
        });
        
        user.coins = rewardAmount;
        referralAwardedToNewUser = true; // Set the flag
        
        console.log(`Prepared referral apply for new user ${user.email}. Referrer: ${referrer.email}, Reward: ${rewardAmount}`);
    }
    // --- End Referral Processing ---

    // Save the new user (includes password hashing via pre-save hook)
    await user.save();
    console.log(`New user ${user.email} saved successfully. ID: ${user._id}`);

    // Award coins to referrer AFTER new user is saved successfully
    if (referrer && rewardAmount > 0) {
      try {
        const freshReferrer = await User.findById(referrer._id);
        if (!freshReferrer) {
          throw new Error('Referrer not found after initial save.');
        }

        freshReferrer.referralCount = (freshReferrer.referralCount || 0) + 1;

        if (typeof freshReferrer.addCoins === 'function') {
          await freshReferrer.addCoins(rewardAmount, `referral_bonus_${user._id}`);
          console.log(`Awarded ${rewardAmount} coins to referrer ${freshReferrer.email} via addCoins.`);
        } else {
          console.warn(`Referrer ${freshReferrer.email} does not have an addCoins method. Saving count only.`);
          await freshReferrer.save();
        }
      } catch (rewardError) {
        console.error(`Failed to award referral coins or update count for ${referrer.email}:`, rewardError);
      }
    }

    // Send success response, including the referral flag
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please proceed to login.',
      referralAwarded: referralAwardedToNewUser
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);
    let errorMessage = 'Registration failed. Please try again.';
    let statusCode = 500;
    if (error.code === 11000 && error.keyPattern?.email) {
      errorMessage = 'Email already registered.';
      statusCode = 400;
    } else if (error.code === 11000 && error.keyPattern?.referralCode) {
      errorMessage = 'An error occurred generating referral code. Please try again.';
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
} 