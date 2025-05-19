import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { sendMail } from '@/lib/nodemailer';
import dbConnect from '@/app/lib/dbConnect';
import Settings from '@/models/Settings';

const EMAIL_CONFIG_KEY = 'emailConfig';

// POST handler to test email settings
export async function POST(req: NextRequest) {
    try {
        // Check admin authorization
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get test email from request body
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Verify email configuration exists
        await dbConnect();
        const emailConfig = await Settings.findOne({ key: EMAIL_CONFIG_KEY });
        if (!emailConfig?.value) {
            return NextResponse.json({ 
                error: 'Email configuration not found. Please configure email settings first.' 
            }, { status: 400 });
        }

        // Send test email
        try {
            await sendMail({
                to: email,
                subject: 'Test Email from Admin Panel',
                text: 'This is a test email sent from the admin panel.',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333;">Test Email</h1>
                        <p>This is a test email sent from the admin panel.</p>
                        <p>If you received this email, your email settings are configured correctly.</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            Sent from: ${emailConfig.value.from}<br>
                            SMTP Host: ${emailConfig.value.host}<br>
                            SMTP Port: ${emailConfig.value.port}
                        </p>
                    </div>
                `
            });

            return NextResponse.json({ 
                success: true,
                message: 'Test email sent successfully' 
            });
        } catch (mailError: any) {
            console.error('[API Test Email Error]', mailError);
            return NextResponse.json({ 
                error: mailError.message || 'Failed to send test email. Please check your SMTP settings.' 
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[API Test Email Error]', error);
        return NextResponse.json({ 
            error: 'Internal server error while testing email configuration' 
        }, { status: 500 });
    }
} 