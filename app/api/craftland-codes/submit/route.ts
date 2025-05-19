import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import CraftlandCodeModel, { ICraftlandCode } from '@/app/models/CraftlandCode';
import mongoose from 'mongoose';
import { uploadFile } from '@/app/lib/gridfs';
import { Types } from 'mongoose';

// Basic rate limiting store (in-memory, reset on server restart)
// For production, use a persistent store like Redis
const submissionAttempts = new Map<string, { count: number, lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 3; // Max 3 submissions per window

// Define allowed values for validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_CATEGORIES = ['Battle Arena', 'Survival', 'Parkour', 'Defense', 'Racing', 'Adventure', 'Puzzle', 'Other'];
const ALLOWED_DIFFICULTIES: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
const ALLOWED_REGIONS = ['IN', 'ID', 'BR', 'MENA', 'US', 'EU', 'TH', 'VN', 'TW', 'RU', 'SA', 'NA', 'BD', 'PK', 'SG', 'MY', 'GLOBAL'];
const CODE_REGEX = /^FFCL-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Helper function for file validation
const validateFile = (file: File | null, fieldName: string): string | null => {
    if (!file) {
        return `${fieldName} is required.`;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return `Invalid file type for ${fieldName}. Only JPEG, PNG, GIF, WebP allowed.`;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return `${fieldName} too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
};

// POST /api/craftland-codes/submit - Deprecated/Disabled
/*
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    // --- Rate Limiting Logic --- 
    const now = Date.now();
    const userAttempts = submissionAttempts.get(userId) || { count: 0, lastAttempt: 0 };

    if (now - userAttempts.lastAttempt > RATE_LIMIT_WINDOW) {
        // Reset count if window expired
        userAttempts.count = 0;
    }

    if (userAttempts.count >= RATE_LIMIT_MAX_ATTEMPTS) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }
    // Update attempts
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    submissionAttempts.set(userId, userAttempts);
    // --- End Rate Limiting ---

    try {
        await dbConnect();

        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const author = formData.get('author') as string;
        const tagsString = formData.get('tags') as string;
        const imageFile = formData.get('image') as File | null;

        // --- Validation ---
        if (!title || !description || !author || !tagsString || !imageFile) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

        if (imageFile.size > MAX_FILE_SIZE) {
            return NextResponse.json({ message: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, { status: 400 });
        }

        if (!ALLOWED_FILE_TYPES.includes(imageFile.type)) {
            return NextResponse.json({ message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 });
        }

        const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tags.length === 0) {
             return NextResponse.json({ message: 'At least one tag is required.' }, { status: 400 });
        }
        // --- End Validation ---

        // --- File Upload ---
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const uniqueFilename = `${Date.now()}-${imageFile.name}`;

        const uploadedFile = await uploadFile(imageBuffer, uniqueFilename, imageFile.type);
        // --- End File Upload ---

        // --- Database Save ---
        const newCode = new CraftlandCodeModel({
            title,
            description,
            code: '', // Code field is managed by admin only
            author,
            tags,
            imageUrl: `/api/files/${uploadedFile.fileId}`,
            submittedBy: new Types.ObjectId(userId),
            status: 'pending',
            region: 'GLOBAL',
            isVerified: false,
            difficulty: 'medium',
            downloadCount: 0,
            upvotes: [],
            downvotes: [],
            likes: [],
        });

        await newCode.save();
        // --- End Database Save ---

        return NextResponse.json({ message: 'Craftland code submitted successfully. It will be reviewed by an admin.', code: newCode }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error submitting Craftland code:', error);
        // Type checking for error message
        let message = 'Internal Server Error';
        if (error instanceof Error) {
             // Check for specific storage error message
             if (error.message.includes('storage')) {
                 message = 'Error uploading image file.';
                 return NextResponse.json({ message }, { status: 500 });
             }
             // Use the specific error message otherwise
             message = error.message;
        }
       
        return NextResponse.json({ message }, { status: 500 });
    }
}
*/ 