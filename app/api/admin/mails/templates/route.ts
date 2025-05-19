import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import EmailTemplate from '@/app/models/EmailTemplate';
import mongoose from 'mongoose';
import { ApiError } from '@/app/lib/api';

// Helper: Check Admin Role & return user object
// Use more specific type for session if available from next-auth
const checkAdmin = (session: any): { id: string; role: string; [key: string]: any } => {
    if (!session?.user?.id || session.user.role !== 'admin') {
        throw new ApiError(401, 'Unauthorized: Admin access required');
    }
    return session.user; // Return the user object
};

// --- GET /api/admin/mails/templates (List Templates) ---
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    try {
        checkAdmin(session);
        await connectDB();

        // Get page and limit from query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const skip = (page - 1) * limit;

        // Validate page/limit
        if (page < 1 || limit < 1 || limit > 100) { // Set a reasonable max limit
            throw new ApiError(400, 'Invalid pagination parameters (page > 0, 0 < limit <= 100).');
        }
        
        // Perform parallel queries for data and total count
        const [templates, totalItems] = await Promise.all([
            EmailTemplate.find({})
                         .sort({ name: 1 }) // Keep existing sort
                         .skip(skip)
                         .limit(limit)
                         .lean(),
            EmailTemplate.countDocuments({}) // Count total matching documents
        ]);

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / limit);

        // Return data with pagination info
        return NextResponse.json({
             success: true, 
             templates, 
             pagination: { 
                 currentPage: page, 
                 totalPages: totalPages, 
                 totalItems: totalItems,
                 itemsPerPage: limit
             } 
        });

    } catch (error: any) {
        console.error('Error fetching email templates:', error);
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
    }
}

// --- POST /api/admin/mails/templates (Create Template) ---
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    try {
        // Assign validated user object
        const adminUser = checkAdmin(session); 
        const adminUserId = adminUser.id; // Use id from the non-null user object
        
        const { name, subject, body } = await req.json();

        if (!name || !subject || !body) {
            return NextResponse.json({ error: 'Name, subject, and body are required.' }, { status: 400 });
        }

        await connectDB();

        const newTemplate = await EmailTemplate.create({
            name,
            subject,
            body,
            createdBy: adminUserId,
        });

        return NextResponse.json({ success: true, template: newTemplate }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating email template:', error);
         if (error instanceof mongoose.Error.ValidationError) {
             const errors = Object.values(error.errors).map(el => el.message);
             return NextResponse.json({ error: `Validation failed: ${errors.join(', ')}` }, { status: 400 });
        }
        // Handle potential duplicate key error for unique name
        if (error.code === 11000 && error.keyPattern?.name) {
            return NextResponse.json({ error: 'A template with this name already exists.' }, { status: 409 });
        }
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 });
    }
} 