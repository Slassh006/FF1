import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import CraftlandCode from '@/app/models/CraftlandCode';
import { uploadFile, deleteFile, fileExists } from '@/app/lib/gridfs';
import { ApiError } from '@/app/lib/api';
import mongoose from 'mongoose'; // Import mongoose for ValidationError check
import { Types } from 'mongoose';

// Constants
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 3;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// Removed unused constants like ALLOWED_REGIONS and CODE_REGEX as validation is now in schema

// Rate limiting store (Consider replacing with Redis in production)
const submissionAttempts = new Map<string, { count: number; lastAttempt: number }>();

// POST /api/craftland-codes (User Submission Endpoint)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;
  const userName = session.user.name || 'Anonymous'; // Get user's name for author field
  const isAdmin = session.user.role === 'admin';

  // Rate limiting for non-admin users
  if (!isAdmin) {
    const now = Date.now();
    const userAttempts = submissionAttempts.get(userId) || { count: 0, lastAttempt: 0 };

    if (now - userAttempts.lastAttempt > RATE_LIMIT_WINDOW) {
      userAttempts.count = 0; // Reset count if window has passed
    }

    if (userAttempts.count >= RATE_LIMIT_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Increment and update attempts
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    submissionAttempts.set(userId, userAttempts);
  }

  try {
    await connectDB();
    const formData = await request.formData();

    // --- Data Extraction ---
    const code = formData.get('code') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const region = formData.get('region') as string;
    const imageFile = formData.get('coverImage') as File | null;
    const difficulty = formData.get('difficulty') as string | undefined;
    const tagsString = formData.get('tags') as string | null; 
    const videoUrl = formData.get('videoUrl') as string | undefined;

    // --- File Presence & Type Check ---
    if (!imageFile) {
      throw new ApiError(400, 'Cover image is required');
    }
    // Basic image type check (GridFS library doesn't validate type implicitly)
    if (!imageFile.type.startsWith('image/')) {
      throw new ApiError(400, 'Invalid file type. Only images are allowed.');
    }
    // Optional: Add size check here if needed (GridFS doesn't enforce it by default)
    // if (imageFile.size > MAX_FILE_SIZE) { ... }
    
    // --- File Upload using GridFS --- 
    const coverBuffer = Buffer.from(await imageFile.arrayBuffer());
    const filename = `craftland-user-${Date.now()}-${imageFile.name}`;
    const contentType = imageFile.type;

    // Call GridFS uploadFile
    const coverUploadResult = await uploadFile(
      coverBuffer,
      filename,
      contentType
    );

    if (!coverUploadResult?.fileId) {
      throw new ApiError(500, 'Failed to upload cover image to GridFS.');
    }

    // Construct URL assuming a /api/files/[id] endpoint exists
    const newImageUrl = `/api/files/${coverUploadResult.fileId}`; 
    const imageId = coverUploadResult.fileId;

    // Process tags string into array
    const tagsArray = tagsString 
        ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) 
        : [];
    
    // --- Database Creation ---
    const newCraftlandCode = await CraftlandCode.create({
      code,
      title,
      description,
      category,
      region,
      coverImage: newImageUrl, // Use the constructed GridFS URL
      coverImageId: imageId, // Store the GridFS file ID
      difficulty: difficulty || undefined,
      tags: tagsArray,
      submittedBy: userId,
      creator: userId,
      author: userName, 
      videoUrl: videoUrl || undefined, // Save the YouTube video URL if provided
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Craftland code submitted successfully and awaiting review.',
      craftlandCode: newCraftlandCode // Consider selecting specific fields to return
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating craftland code:', error);

    // Handle Mongoose Validation Errors
    if (error instanceof mongoose.Error.ValidationError) {
      // Extract validation messages
      const errors = Object.values(error.errors).map(el => el.message);
      return NextResponse.json({ error: `Validation failed: ${errors.join(', ')}` }, { status: 400 });
    }

    // Handle custom ApiErrors
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    // Handle duplicate key error (for unique 'code' field)
    if (error.code === 11000 && error.keyPattern?.code) {
       return NextResponse.json({ error: 'This Craftland code already exists.' }, { status: 409 }); // Conflict
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Failed to create craftland code. Please try again.' },
      { status: 500 }
    );
  }
}

// GET /api/craftland-codes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    await connectDB();

    // Build query based on user role
    // Admins see all, users only see verified codes on this specific GET route
    // Note: /api/craftland might have different logic
    const query: any = {};
    if (!isAdmin) {
      query.isVerified = true; // Non-admins only see verified codes here
      query.status = 'approved'; // Only show approved codes
      query.isActive = true; // Only show active codes
    }

    // Fetch codes, populate creator (ensure 'avatar' is included if needed)
    const craftlandCodes = await CraftlandCode.find(query)
      .sort({ createdAt: -1 })
      // Populate creator with necessary fields
      .populate('creator', 'name email avatar') // Explicitly add avatar
      .lean(); // Use lean for performance if not modifying docs

    // Optional: Map avatar to image if frontend expects 'image'
    const results = craftlandCodes.map(code => ({
      ...code,
      creator: code.creator ? {
        ...code.creator,
        image: (code.creator as any).avatar // Map avatar to image
      } : null
    }));

    return NextResponse.json({ success: true, craftlandCodes: results }); // Return mapped results

  } catch (error: any) {
    console.error('Error fetching craftland codes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch craftland codes' },
      { status: 500 }
    );
  }
}

// PUT /api/craftland-codes (User Update Endpoint)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const id = formData.get('id') as string;
    const oldCoverImageId = formData.get('oldCoverImageId') as string;

    // Get the existing code
    const existingCode = await CraftlandCode.findById(id);
    if (!existingCode) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    // Verify ownership
    if (existingCode.submittedBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this code' }, { status: 403 });
    }

    // Handle cover image upload if provided
    let coverImageUrl = existingCode.coverImage;
    let coverImageId = existingCode.coverImageId;
    const coverImageFile = formData.get('coverImage') as File;
    
    if (coverImageFile) {
      console.log(`[Craftland Code Update] Processing cover image upload for code ${id}`);
      
      // Validate file
      if (!ALLOWED_IMAGE_TYPES.includes(coverImageFile.type)) {
        console.warn(`[Craftland Code Update] Invalid file type attempted: ${coverImageFile.type}`);
        return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP, GIF are allowed.' }, { status: 400 });
      }
      if (coverImageFile.size > MAX_FILE_SIZE) {
        console.warn(`[Craftland Code Update] File size exceeds limit: ${coverImageFile.size} bytes`);
        return NextResponse.json({ error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, { status: 413 });
      }

      // Delete old cover image if it exists
      if (oldCoverImageId) {
        try {
          if (await fileExists(oldCoverImageId)) {
            await deleteFile(oldCoverImageId);
            console.log(`[Craftland Code Update] Successfully deleted old cover image from GridFS: ${oldCoverImageId}`);
          } else {
            console.warn(`[Craftland Code Update] Old cover image ${oldCoverImageId} not found in GridFS for deletion.`);
          }
        } catch (error) {
          console.error(`[Craftland Code Update] Failed to delete old cover image ${oldCoverImageId} from GridFS:`, error);
          // Continue with the update even if deletion fails
        }
      }

      // Upload new cover image
      try {
        const buffer = Buffer.from(await coverImageFile.arrayBuffer());
        const fileExtension = coverImageFile.type.split('/')[1] || 'bin';
        const gridFsFilename = `craftland-code-${id}-${Date.now()}.${fileExtension}`;
        
        console.log(`[Craftland Code Update] Uploading new cover image: ${gridFsFilename} (${buffer.length} bytes)`);
        
        const uploadResult = await uploadFile(buffer, gridFsFilename, coverImageFile.type);
        if (!uploadResult || !uploadResult.fileId) {
          throw new Error('Failed to upload cover image');
        }
        
        coverImageId = uploadResult.fileId;
        coverImageUrl = `/api/files/${uploadResult.fileId}`;
        console.log(`[Craftland Code Update] New cover image uploaded to GridFS: ${gridFsFilename} (ID: ${uploadResult.fileId})`);
      } catch (error) {
        console.error('[Craftland Code Update] Failed to upload new cover image:', error);
        return NextResponse.json({ error: 'Failed to upload cover image' }, { status: 500 });
      }
    }

    // Update the code
    const updatedCode = await CraftlandCode.findByIdAndUpdate(
      id,
      {
        code: formData.get('code'),
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        region: formData.get('region'),
        difficulty: formData.get('difficulty'),
        videoUrl: formData.get('videoUrl'),
        coverImage: coverImageUrl,
        coverImageId: coverImageId,
        features: formData.getAll('features[]'),
      },
      { new: true }
    );

    return NextResponse.json({ craftlandCode: updatedCode });
  } catch (error: any) {
    console.error('Error updating craftland code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update craftland code' },
      { status: 500 }
    );
  }
}

// DELETE /api/craftland-codes (User Delete Endpoint)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get the code to verify ownership and delete its cover image
    const code = await CraftlandCode.findById(id);
    if (!code) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    // Verify ownership
    if (code.submittedBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this code' }, { status: 403 });
    }

    // Delete cover image if exists
    if (code.coverImageId) {
      try {
        if (await fileExists(code.coverImageId)) {
          await deleteFile(code.coverImageId);
          console.log(`[Craftland Code Delete] Successfully deleted cover image from GridFS: ${code.coverImageId}`);
        } else {
          console.warn(`[Craftland Code Delete] Cover image ${code.coverImageId} not found in GridFS for deletion.`);
        }
      } catch (error) {
        console.error(`[Craftland Code Delete] Failed to delete cover image ${code.coverImageId} from GridFS:`, error);
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete the code
    await CraftlandCode.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Code deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting craftland code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete craftland code' },
      { status: 500 }
    );
  }
} 