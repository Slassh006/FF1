import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// Correcting the import path again based on the export from the route file
// import { authOptions } from '@/lib/auth'; // Original path
// import { options as authOptions } from '@/app/api/auth/[...nextauth]/route'; // Previous attempt
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import Settings from '@/models/Settings'; // Using the detailed Settings model
import User from '@/models/User'; // Needed for updatedBy field

// Helper function to update or insert a setting
async function upsertSetting(key: string, value: any, type: string, description: string, category: string, updatedBy: string, isPublic: boolean = false) {
  await Settings.findOneAndUpdate(
    { key },
    { 
      value, 
      type, 
      description, 
      category, 
      updatedBy,
      isPublic 
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function PUT(request: Request) {
  // Try getting session with potentially corrected authOptions
  const session = await getServerSession(authOptions);

  // <<< Logging Start >>>
  console.log("API Route: /api/admin/settings/general - Session Received:", JSON.stringify(session, null, 2));
  // <<< Logging End >>>

  if (!session || !session.user) {
    console.error("API Route: /api/admin/settings/general - Authentication Failed: No session or user in session.");
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check if user is admin
  await dbConnect();
  
  let user = null;
  try {
    user = await User.findById(session.user.id);
    // <<< Logging Start >>>
    console.log("API Route: /api/admin/settings/general - User Found by ID:", JSON.stringify(user, null, 2));
    // <<< Logging End >>>
  } catch (dbError) {
      console.error("API Route: /api/admin/settings/general - Error fetching user by ID:", dbError);
      return NextResponse.json({ error: 'Database error checking authorization' }, { status: 500 });
  }

  if (!user || user.role !== 'admin') {
    // <<< Logging Start >>>
    console.warn(`API Route: /api/admin/settings/general - Authorization Failed: User role is not admin. User: ${user ? user.email : 'Not Found'}, Role: ${user ? user.role : 'N/A'}`);
    // <<< Logging End >>>
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const userIdString = user._id.toString(); // Convert ObjectId to string

  try {
    const body = await request.json();
    const { 
      siteName, 
      siteDescription, 
      enabled, 
      showBlogSection, 
      showWallpaperSection, 
      showRedeemCodesSection, 
      showCraftlandCodesSection,
      referralCoinReward
    } = body;

    // Validate referralCoinReward
    if (typeof referralCoinReward !== 'number' || referralCoinReward < 0 || !Number.isInteger(referralCoinReward)) {
       return NextResponse.json({ error: 'Invalid Referral Coin Reward value. Must be a non-negative integer.' }, { status: 400 });
    }

    // Update settings in the database
    await upsertSetting('siteName', siteName, 'string', 'The display name of the website.', 'general', userIdString);
    await upsertSetting('siteDescription', siteDescription, 'string', 'A short description for the website (used in meta tags).', 'general', userIdString);
    await upsertSetting('maintenance.enabled', enabled, 'boolean', 'Enable maintenance mode for the site.', 'maintenance', userIdString);
    await upsertSetting('showBlogSection', showBlogSection, 'boolean', 'Toggle visibility of the Blog section.', 'general', userIdString, true);
    await upsertSetting('showWallpaperSection', showWallpaperSection, 'boolean', 'Toggle visibility of the Wallpaper section.', 'general', userIdString, true);
    await upsertSetting('showRedeemCodesSection', showRedeemCodesSection, 'boolean', 'Toggle visibility of the Redeem Codes section.', 'general', userIdString, true);
    await upsertSetting('showCraftlandCodesSection', showCraftlandCodesSection, 'boolean', 'Toggle visibility of the Craftland Codes section.', 'general', userIdString, true);
    
    // Upsert the referral coin reward setting
    await upsertSetting(
      'referralCoinReward', 
      referralCoinReward, 
      'number', // Type is number
      'Number of coins awarded for each successful referral.', 
      'general', // Category
      userIdString, // Use the string version of the ID
      true // Make it public so profile page can fetch it easily
    );

    return NextResponse.json({ success: true, message: 'General settings updated successfully' });

  } catch (error) {
    console.error('Error updating general settings:', error);
    // Check if the error is a validation error or other specific type if needed
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message || 'Failed to update general settings' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to update general settings' }, { status: 500 });
  }
}

// Optional: Add a GET handler if needed to fetch all general settings at once
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Optional: Admin check if only admins should fetch all settings
    // const user = await User.findById(session.user.id);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    // }

    try {
        await dbConnect();
        // Fetch settings relevant to the 'general' category or specific keys
        const keysToFetch = [
            'siteName', 
            'siteDescription', 
            'maintenance.enabled', 
            'showBlogSection', 
            'showWallpaperSection', 
            'showRedeemCodesSection', 
            'showCraftlandCodesSection',
            'referralCoinReward'
        ];
        const settings = await Settings.find({ key: { $in: keysToFetch } });

        // Format the settings into a key-value object
        const settingsObject = settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, any>);
        
        // Ensure default values if settings don't exist yet
        const defaults = {
            siteName: 'TheFreeFireIndia',
            siteDescription: 'Your Ultimate Free Fire Fan Hub',
            enabled: false,
            showBlogSection: true,
            showWallpaperSection: true,
            showRedeemCodesSection: true,
            showCraftlandCodesSection: true,
            referralCoinReward: 1, // Default reward
        };

        const finalSettings = { ...defaults, ...settingsObject };

        return NextResponse.json(finalSettings);

    } catch (error) {
        console.error('Error fetching general settings:', error);
        return NextResponse.json({ error: 'Failed to fetch general settings' }, { status: 500 });
    }
} 