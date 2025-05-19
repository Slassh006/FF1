import { NextRequest, NextResponse } from 'next/server';
import { getFileStream } from '@/app/lib/gridfs';
import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoClient } from '@/lib/db';
// Note: NextResponse typically handles Node.js Readable streams well,
// but explicitly importing Readable might be needed for type checking or transformations.
// import { Readable } from 'stream';

// Helper to get GridFS Bucket - Ensure 'wallpapers' matches the name in gridfs.ts
// Consider moving this to lib/gridfs.ts if reused elsewhere.
async function getBucket(): Promise<GridFSBucket> {
  const client = await getMongoClient();
  const db = client.db();
  return new GridFSBucket(db, { bucketName: 'wallpapers' });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const fileId = params.id;
  console.log(`[File Serve] Received request for file ID: ${fileId}`);

  // 1. Validate ID format
  if (!fileId || !ObjectId.isValid(fileId)) {
    console.warn(`[File Serve] Invalid file ID format received: ${fileId}`);
    return NextResponse.json({ error: 'Invalid file ID format' }, { status: 400 });
  }

  try {
    const objectId = new ObjectId(fileId);
    const bucket = await getBucket();

    // 2. Get File Metadata (for Content-Type and existence check)
    // We need this *before* getting the stream to set headers correctly.
    const files = await bucket.find({ _id: objectId }).limit(1).toArray();
    if (files.length === 0) {
      console.warn(`[File Serve] File metadata not found for ID: ${fileId}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    const fileInfo = files[0];
    const contentType = fileInfo.contentType || 'application/octet-stream'; // Default if not set
    const filename = fileInfo.filename || `file-${fileId}`; // Default filename
    console.log(`[File Serve] Found metadata for ID ${fileId}: Name=${filename}, Type=${contentType}`);

    // 3. Get File Stream
    // We assume getFileStream handles internal stream errors or they are caught below.
    console.log(`[File Serve] Attempting to get stream for ID: ${fileId}`);
    const stream = await getFileStream(fileId);
    console.log(`[File Serve] Successfully obtained stream for ID: ${fileId}`);

    // 4. Create and Return Streaming Response
    // NextResponse can usually handle Node.js Readable streams directly.
    // If issues arise, conversion to a Web Stream might be needed.
    const response = new NextResponse(stream as any); // Using 'as any' for broader stream type compatibility initially

    // Set essential headers
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Length', fileInfo.length.toString()); // Set content length from metadata

    // Optional: Suggest filename (useful if user saves the file directly)
    // Use encodeURIComponent for filenames with special characters
    response.headers.set(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(filename)}"`
    );

    // Optional: Cache control (aggressively cache immutable files like uploads)
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year

    console.log(`[File Serve] Sending response for ID: ${fileId}`);
    return response;

  } catch (error: any) {
    console.error(`[File Serve] Error serving file ${fileId}:`, error);

    // Handle specific errors if possible (e.g., from getFileStream)
    if (error instanceof Error && error.message.includes('File not found')) {
       return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes('Invalid file ID format')) {
        return NextResponse.json({ error: 'Invalid file ID format' }, { status: 400 });
     }

    // Generic error for other issues
    return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 500 });
  }
} 