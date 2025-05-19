import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import Setting from '@/models/Setting';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

const REFERRAL_APPLY_IP_CHECK_HOURS = 24; // Limit referral applies per IP per day

export async function POST(request: NextRequest) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await request.json();
        const { referralCode } = body;

        if (!referralCode || typeof referralCode !== 'string') {
            return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
        }

        const upperRefCode = referralCode.trim().toUpperCase();
        if (!upperRefCode) {
            return NextResponse.json({ error: 'Referral code cannot be empty' }, { status: 400 });
        }

        // --- Fetch Applicant and Select appliedReferrals field ---
        const applicant = await User.findById(userId).select('+appliedReferrals'); // Ensure the field is selected
        if (!applicant) {
            return NextResponse.json({ error: 'Applicant user not found' }, { status: 404 });
        }
        
        // --- Find Referrer & Check Self-Referral ---
        const referrer = await User.findOne({ referralCode: upperRefCode });
        if (!referrer) {
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
        }
        if (referrer._id.equals(applicant._id)) {
            return NextResponse.json({ error: 'You cannot refer yourself' }, { status: 400 });
        }

        // --- ADDED Check if this referrer's code already applied --- 
        const alreadyApplied = applicant.appliedReferrals.some(
            (ref: any) => ref.referrerId.equals(referrer._id)
        );
        if (alreadyApplied) {
            return NextResponse.json({ error: 'Referral code from this user has already been applied' }, { status: 400 });
        }
        // ----------------------------------------------------------

        // --- Anti-Spam: IP Address Check ---
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                          request.headers.get('x-real-ip') || 
                          request.headers.get('remote-addr') || 
                          'unknown';

        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - REFERRAL_APPLY_IP_CHECK_HOURS);
        
        const recentReferralApplyFromIp = await User.findOne({
            'activityLog': {
                $elemMatch: {
                    type: 'referral_applied', // Check specifically for the apply action
                    ip: ipAddress,
                    createdAt: { $gte: cutoffDate },
                }
            }
        });

        if (recentReferralApplyFromIp) {
            console.warn(`Referral apply limit reached for IP ${ipAddress}.`);
            return NextResponse.json({ error: `Referral code already applied from this network recently. Please try again later.` }, { status: 429 }); // 429 Too Many Requests
        }

        // --- Fetch Referral Reward Setting ---
        let referralRewardValue = 0;
        try {
            const rewardSetting = await Setting.findOne({ key: 'referralCoinReward' });
            if (rewardSetting && typeof rewardSetting.value === 'number' && rewardSetting.value >= 0) {
                referralRewardValue = rewardSetting.value;
            }
        } catch (settingError) {
            console.error('Error fetching referral reward setting during apply:', settingError);
        }

        // --- Perform Updates --- 
        // Add to applicant's applied list
        applicant.appliedReferrals.push({
            referrerId: referrer._id,
            codeUsed: upperRefCode,
            appliedAt: new Date()
        });

        // Use Promise.all for coin awards & log applicant activity
        await Promise.all([
            applicant.addCoins(referralRewardValue, `referral_applied_${referrer._id}`), // Award applicant
            applicant.logActivity('referral_applied', { refCode: upperRefCode, referrerId: referrer._id.toString() }, ipAddress, request.headers.get('user-agent') || 'unknown')
            // Note: addCoins and logActivity should handle saving the applicant with the new appliedReferrals array
        ]);
       
        // Update Referrer count and award coins
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await Promise.all([
            referrer.addCoins(referralRewardValue, `referral_bonus_${applicant._id}`), // Award referrer
            referrer.logActivity('referral_credited', { referredUserId: applicant._id.toString() }, ipAddress)
             // Note: addCoins and logActivity should handle saving the referrer
        ]);
        
        console.log(`Referral code ${upperRefCode} applied successfully by user ${applicant._id} from referrer ${referrer._id}. Awarded ${referralRewardValue} coins to each.`);

        return NextResponse.json({ success: true, message: 'Referral code applied successfully!' });

    } catch (error) {
        console.error('[API Apply Referral POST Error]', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to apply referral code';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 