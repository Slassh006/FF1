import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import Settings from '@/models/Settings';

const SECURITY_CONFIG_KEY = 'securityConfig';

// Default security settings
const DEFAULT_SECURITY_SETTINGS = {
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  passwordExpiry: 90,
  enableTwoFactor: false,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

// GET /api/admin/settings/security
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    try {
      // Try to find existing settings
      const securitySetting = await Settings.findOne({ key: SECURITY_CONFIG_KEY });

      // If no settings exist, create default settings
      if (!securitySetting) {
        await Settings.create({
          key: SECURITY_CONFIG_KEY,
          value: DEFAULT_SECURITY_SETTINGS,
          type: 'object',
          description: 'Security settings configuration',
          category: 'security',
          isPublic: false,
          updatedBy: session.user.id
        });

        return NextResponse.json(DEFAULT_SECURITY_SETTINGS);
      }

      return NextResponse.json(securitySetting.value);
    } catch (dbError) {
      console.error('[API Get Security Settings Error]', dbError);
      return NextResponse.json({ error: 'Failed to fetch security settings' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API Get Security Settings Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/admin/settings/security
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      'sessionTimeout',
      'maxLoginAttempts',
      'lockoutDuration',
      'passwordExpiry',
      'enableTwoFactor',
      'requireUppercase',
      'requireLowercase',
      'requireNumbers',
      'requireSpecialChars'
    ];

    for (const field of requiredFields) {
      if (data[field] === undefined) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Validate numeric fields
    if (
      typeof data.sessionTimeout !== 'number' ||
      typeof data.maxLoginAttempts !== 'number' ||
      typeof data.lockoutDuration !== 'number' ||
      typeof data.passwordExpiry !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid numeric fields' }, { status: 400 });
    }

    // Validate boolean fields
    if (
      typeof data.enableTwoFactor !== 'boolean' ||
      typeof data.requireUppercase !== 'boolean' ||
      typeof data.requireLowercase !== 'boolean' ||
      typeof data.requireNumbers !== 'boolean' ||
      typeof data.requireSpecialChars !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Invalid boolean fields' }, { status: 400 });
    }

    // Validate ranges
    if (data.sessionTimeout < 5 || data.sessionTimeout > 1440) {
      return NextResponse.json({ error: 'Session timeout must be between 5 and 1440 minutes' }, { status: 400 });
    }

    if (data.maxLoginAttempts < 3 || data.maxLoginAttempts > 10) {
      return NextResponse.json({ error: 'Max login attempts must be between 3 and 10' }, { status: 400 });
    }

    if (data.lockoutDuration < 5 || data.lockoutDuration > 60) {
      return NextResponse.json({ error: 'Lockout duration must be between 5 and 60 minutes' }, { status: 400 });
    }

    if (data.passwordExpiry < 30 || data.passwordExpiry > 365) {
      return NextResponse.json({ error: 'Password expiry must be between 30 and 365 days' }, { status: 400 });
    }

    await dbConnect();
    try {
      // Update or create settings
      const securitySettings = await Settings.findOneAndUpdate(
        { key: SECURITY_CONFIG_KEY },
        {
          $set: {
            key: SECURITY_CONFIG_KEY,
            value: data,
            type: 'object',
            description: 'Security settings configuration',
            category: 'security',
            isPublic: false,
            updatedBy: session.user.id
          }
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Security settings updated successfully',
        settings: securitySettings.value
      });
    } catch (dbError) {
      console.error('[API Update Security Settings Error]', dbError);
      return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API Update Security Settings Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 