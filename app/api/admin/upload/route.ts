import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Corrected path
import dbConnect from '@/lib/dbConnect';
// import Media, { IMedia } from '@/app/models/Media'; // <-- REMOVED IMPORT
import { uploadFile } from '@/app/lib/gridfs'; // <-- Import GridFS upload
// import { Types } from 'mongoose'; // <-- Import Types for ObjectId (Likely no longer needed)

// Basic inline filename sanitizer (copied from media route)
const sanitizeFilename = (filename: string): string => {
    const cleaned = filename.replace(/[^a-zA-Z0-9\.\-\_]/g, '_').replace(/\s+/g, '-');
    return cleaned.substring(0, 100);
};

// Use the main uploads directory
// const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB - Keep Tiptap limit lower?
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Ensure upload directory exists (copied from media route)
// const ensureUploadDirExists = async () => { ... };

export async function POST(req: NextRequest) {
  // 1. Check Authentication & Authorization
  const session = await getServerSession(authOptions);
  // Allow superadmin as well
  if (!session?.user || !['admin', 'superadmin'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Connect DB (Might not be strictly necessary anymore, but harmless)
  await dbConnect();
  // await ensureUploadDirExists(); // Removed

  try {
    // 3. Get FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // 4. Validate File
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, { status: 413 }); // Use 413 for payload too large
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP, GIF are allowed.' }, { status: 400 });
    }

    // 5. Process File Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalFilename = file.name;

    // Generate a unique filename for GridFS storage (can still use sanitization)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = originalFilename.includes('.') ? originalFilename.substring(originalFilename.lastIndexOf('.')) : `.${file.type.split('/')[1] || 'bin'}`;
    const sanitizedBaseName = sanitizeFilename(originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename);
    const gridFsFilename = `${sanitizedBaseName}-${uniqueSuffix}${fileExtension}`;


    // 6. Upload to GridFS
    const uploadResult = await uploadFile(buffer, gridFsFilename, file.type);
    if (!uploadResult || !uploadResult.fileId) {
         console.error('GridFS upload failed to return fileId.');
         throw new Error('Failed to upload file to storage.');
    }
    const fileId = uploadResult.fileId;
    const gridFsUrl = `/api/files/${fileId}`; // <-- URL format for GridFS access
    console.log(`File uploaded to GridFS: ${gridFsFilename} (ID: ${fileId}), URL: ${gridFsUrl}`);

    // --- SECTION REMOVED: Create Database Record ---
    /*
    const fileType = file.type.startsWith('image') ? 'image' : 'video';
    const newMediaData: Partial<IMedia> = {
        filename: originalFilename,
        fileId: new Types.ObjectId(fileId),
        url: gridFsUrl,
        size: file.size,
        type: 'image',
        mimeType: file.type,
    };
    const newMedia = new Media(newMediaData);
    await newMedia.save();
    console.log(`GridFS upload DB record created: ${newMedia._id} for fileId: ${fileId}`);
    */
    // --- END REMOVED SECTION ---

    // 8. Return GridFS URL
    return NextResponse.json({ success: true, url: gridFsUrl }, { status: 201 }); // <-- Return GridFS URL

  } catch (error: any) {
    console.error('GridFS Upload failed:', error);
    // Keep existing error handling, but 11000 is now irrelevant
    // if (error.code === 11000) { ... }
    if (error instanceof Error && error.message.includes('exceeds the configured limit')) {
         return NextResponse.json({ error: `File size exceeds the server limit.` }, { status: 413 });
    }
    if (error instanceof Error && error.message.includes('Failed to upload file')) {
         return NextResponse.json({ error: 'Storage service failed to save the file.', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An error occurred during file upload.', details: error.message }, { status: 500 });
  }
} 