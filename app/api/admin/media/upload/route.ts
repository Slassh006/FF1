import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import { initializeGridFS, getBucket } from '@/lib/gridfs'; // Import getBucket
import Media from '@/models/Media'; // Adjust path
import crypto from 'crypto';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises'; // For piping streams
import { uploadFile } from '@/app/lib/gridfs';

// Define allowed file types (adjust as needed)
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
];
const MAX_FILE_SIZE = 1024 * 1024 * 100; // 100MB example limit

// Helper function to convert Web Stream to Node Readable
async function* streamToIterator(stream: ReadableStream<Uint8Array>): AsyncIterable<Buffer> {
    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }
            yield Buffer.from(value);
        }
    } finally {
        reader.releaseLock();
    }
}

// --- API Route Handler ---
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await dbConnect();
        initializeGridFS(); // Ensure GridFS is ready

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        // --- File Validation ---
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        if (file.size === 0) {
            return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ error: `File type not supported: ${file.type}` }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: `File size exceeds limit (${MAX_FILE_SIZE / 1024 / 1024}MB).` }, { status: 400 });
        }
        // --- End File Validation ---

        const bucket = getBucket();

        // Generate unique filename for GridFS
        const uniqueFilename = crypto.randomBytes(16).toString('hex') + path.extname(file.name);

        // Open GridFS upload stream
        const uploadStream = bucket.openUploadStream(uniqueFilename, {
            contentType: file.type,
            metadata: { originalFilename: file.name } // Optional: store original name in GridFS metadata
        });

        // Convert File's Web Stream to Node.js Readable and pipe to GridFS
        const nodeReadable = Readable.from(streamToIterator(file.stream()));
        await pipeline(nodeReadable, uploadStream);

        // The uploadStream.id is available *after* the stream finishes (implicitly via pipeline)
        const fileId = uploadStream.id;

        if (!fileId) {
            // This case should ideally not happen if pipeline succeeds without error
            console.error('GridFS file ID not obtained after upload stream finished.');
            throw new Error('Failed to get GridFS file ID after upload.');
        }

        // Generate unique slug for metadata
        const slug = `media-${uuidv4()}`;

        // Create metadata document
        const newMedia = new Media({
            slug: slug,
            filename: file.name, // Use original filename for metadata display
            size: file.size,
            type: file.type,
            gridFsId: fileId,
            // You could potentially get caption/altText from formData too if needed:
            // caption: formData.get('caption') as string || '',
            // altText: formData.get('altText') as string || '',
        });

        await newMedia.save();

        const savedMediaObject = newMedia.toObject({ virtuals: true });

        return NextResponse.json({ success: true, media: savedMediaObject }, { status: 201 });

    } catch (error: any) {
        console.error('Upload Error:', error);
        // Provide more specific error messages if possible
        if (error.message.startsWith('File type not supported') || error.message.startsWith('File size exceeds limit')) {
             return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.code === 'ERR_STREAM_PREMATURE_CLOSE') {
             console.error('Stream Error: Likely client disconnected during upload.');
             return NextResponse.json({ error: 'Upload interrupted.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error during upload.', details: error.message }, { status: 500 });
    }
}
