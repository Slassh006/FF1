import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import fs from 'fs';
import path from 'path';
import { loadTurnstileSettings } from '@/lib/loadTurnstileSettings';
import Settings from '@/models/Settings';
import { ISettings } from '@/models/Settings';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const settings = await Settings.find({
      key: { $in: ['turnstile.siteKey', 'turnstile.secretKey', 'turnstile.enabled'] }
    });

    const formattedSettings = settings.reduce((acc: Record<string, any>, setting: ISettings) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return NextResponse.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching turnstile settings:', error);
    return NextResponse.json({ error: 'Failed to fetch turnstile settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { siteKey, secretKey, enabled } = await request.json();

    // Validate inputs
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 });
    }

    if (enabled && (!siteKey || !secretKey)) {
      return NextResponse.json({ error: 'Site key and secret key are required when Turnstile is enabled' }, { status: 400 });
    }

    await dbConnect();

    // Update or create settings
    await Promise.all([
      Settings.findOneAndUpdate(
        { key: 'turnstile.siteKey' },
        { 
          value: siteKey,
          type: 'string',
          description: 'Turnstile site key',
          category: 'security',
          isPublic: true,
          updatedBy: session.user.id
        },
        { upsert: true }
      ),
      Settings.findOneAndUpdate(
        { key: 'turnstile.secretKey' },
        { 
          value: secretKey,
          type: 'string',
          description: 'Turnstile secret key',
          category: 'security',
          isPublic: false,
          updatedBy: session.user.id
        },
        { upsert: true }
      ),
      Settings.findOneAndUpdate(
        { key: 'turnstile.enabled' },
        { 
          value: enabled,
          type: 'boolean',
          description: 'Enable/disable Turnstile',
          category: 'security',
          isPublic: true,
          updatedBy: session.user.id
        },
        { upsert: true }
      )
    ]);

    // Reload settings into the shared cache using the server-side function
    await loadTurnstileSettings();

    // Only update .env file in production
    if (process.env.NODE_ENV === 'production') {
      try {
        // Update .env file for persistence across restarts
        const envPath = path.resolve(process.cwd(), '.env');
        let envContent = '';
        
        // Read existing .env file if it exists
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        if (enabled) {
          // Update .env file
          const siteKeyRegex = /NEXT_PUBLIC_TURNSTILE_SITE_KEY=.*/;
          const secretKeyRegex = /TURNSTILE_SECRET_KEY=.*/;
          
          if (siteKeyRegex.test(envContent)) {
            envContent = envContent.replace(siteKeyRegex, `NEXT_PUBLIC_TURNSTILE_SITE_KEY=${siteKey}`);
          } else {
            envContent += `\nNEXT_PUBLIC_TURNSTILE_SITE_KEY=${siteKey}`;
          }
          
          if (secretKeyRegex.test(envContent)) {
            envContent = envContent.replace(secretKeyRegex, `TURNSTILE_SECRET_KEY=${secretKey}`);
          } else {
            envContent += `\nTURNSTILE_SECRET_KEY=${secretKey}`;
          }
        } else {
          // Remove from .env file if present
          envContent = envContent
            .replace(/NEXT_PUBLIC_TURNSTILE_SITE_KEY=.*\n?/g, '')
            .replace(/TURNSTILE_SECRET_KEY=.*\n?/g, '');
        }
        
        // Write updated .env file
        fs.writeFileSync(envPath, envContent);
      } catch (err) {
        console.error('Error updating .env file:', err);
      }
    }

    return NextResponse.json({ message: 'Turnstile settings updated successfully' });
  } catch (error) {
    console.error('Error updating turnstile settings:', error);
    return NextResponse.json({ error: 'Failed to update turnstile settings' }, { status: 500 });
  }
} 