import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import { sendMail } from '@/app/lib/nodemailer'; // Use the existing Nodemailer function
import User from '@/models/User';
import AdminMailLog from '@/models/AdminMailLog';
import EmailTemplate from '@/models/EmailTemplate'; // No interface needed here
import mongoose from 'mongoose';
import { ApiError } from '@/app/lib/api';
import { sendEmail } from '@/lib/email';
import { templates } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { validateEmail } from '@/lib/validators';

// Define attachment structure for nodemailer
interface NodemailerAttachment {
    filename: string;
    content: Buffer;
    contentType: string;
}

// Helper: Check Admin Role & return user object
const checkAdmin = (session: any): { id: string; role: string; [key: string]: any } => {
    if (!session?.user?.id || session.user.role !== 'admin') {
        throw new ApiError(401, 'Unauthorized: Admin access required');
    }
    return session.user;
};

// Placeholder replacement function
const replacePlaceholders = (content: string, user: { email: string; name?: string; [key: string]: any }): string => {
    let replacedContent = content;
    if (!content) return '';
    
    // Replace user data placeholders
    replacedContent = replacedContent.replace(/{{user\.email}}/g, user.email || '');
    replacedContent = replacedContent.replace(/{{user\.name}}/g, user.name || 'User');
    
    // Replace any other dynamic content
    replacedContent = replacedContent.replace(/{{date}}/g, new Date().toLocaleDateString());
    replacedContent = replacedContent.replace(/{{year}}/g, new Date().getFullYear().toString());
    
    return replacedContent;
};

// --- POST /api/admin/mails/send (Admin Send Mail) ---
export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const limiter = await rateLimit();
        const result = await limiter.check(10, 'EMAIL_SEND'); // 10 requests per minute
        if (!result.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { to, template, data, customSubject, customBody } = body;

        // Validate recipients
        if (!to || !Array.isArray(to) || to.length === 0) {
            return NextResponse.json(
                { error: 'At least one recipient is required.' },
                { status: 400 }
            );
        }

        // Validate email addresses
        const invalidEmails = to.filter(email => !validateEmail(email));
        if (invalidEmails.length > 0) {
            return NextResponse.json(
                { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
                { status: 400 }
            );
        }

        // Handle template-based email
        if (template) {
            if (!templates[template]) {
                return NextResponse.json(
                    { error: `Invalid template: ${template}` },
                    { status: 400 }
                );
            }

            // Send to each recipient
            const results = await Promise.all(
                to.map(async (email) => {
                    try {
                        const result = await sendEmail(email, template, ...(data || []));
                        return { email, success: true, jobId: result.jobId };
                    } catch (error) {
                        return { email, success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
                    }
                })
            );

            return NextResponse.json({
                success: true,
                results
            });
        }

        // Handle custom email
        if (!customSubject || !customBody) {
            return NextResponse.json(
                { error: 'Custom subject and body are required when not using a template.' },
                { status: 400 }
            );
        }

        // Send custom email to each recipient
        const results = await Promise.all(
            to.map(async (email) => {
                try {
                    const result = await sendEmail(email, 'custom', {
                        subject: customSubject,
                        html: customBody
                    });
                    return { email, success: true, jobId: result.jobId };
                } catch (error) {
                    return { email, success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
                }
            })
        );

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 