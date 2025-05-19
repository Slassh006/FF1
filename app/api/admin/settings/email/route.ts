import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import Settings from '@/models/Settings';
import { encrypt } from '@/lib/encryption';

const EMAIL_CONFIG_KEY = 'emailConfig';

// GET handler to fetch current email settings
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    try {
        const emailSetting = await Settings.findOne({ key: EMAIL_CONFIG_KEY });
        if (!emailSetting) {
            return NextResponse.json({ 
                host: '', 
                port: '', 
                secure: false,
                auth: {
                    user: '', 
                    pass: ''
                },
                from: '' 
            }); 
        }
        return NextResponse.json(emailSetting.value);
    } catch (error) {
        console.error('[API Get Email Settings Error]', error);
        return NextResponse.json({ error: 'Failed to fetch email settings' }, { status: 500 });
    }
}

// PUT handler to update email settings
export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    try {
        const body = await request.json();
        const { host, port, secure, auth, from } = body;

        // Basic validation
        if (!host || !port || !auth?.user || !auth?.pass || !from) {
            return NextResponse.json({ 
                error: 'Missing required email configuration fields' 
            }, { status: 400 });
        }

        // Validate port
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum <= 0) {
            return NextResponse.json({ 
                error: 'Invalid port number' 
            }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(from)) {
            return NextResponse.json({ 
                error: 'Invalid from email address' 
            }, { status: 400 });
        }

        // Store the configuration object with encrypted password
        const emailConfigValue = {
            host: host.trim(),
            port: portNum,
            secure: !!secure,
            auth: {
                user: auth.user.trim(),
                pass: encrypt(auth.pass) // Encrypt password before storing
            },
            from: from.trim()
        };

        // Update or insert the setting
        await Settings.findOneAndUpdate(
            { key: EMAIL_CONFIG_KEY },
            { $set: { key: EMAIL_CONFIG_KEY, value: emailConfigValue } },
            { upsert: true, new: true }
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Email settings updated successfully' 
        });

    } catch (error) {
        console.error('[API Update Email Settings Error]', error);
        return NextResponse.json({ 
            error: 'Failed to update email settings' 
        }, { status: 500 });
    }
} 