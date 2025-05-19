import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '../../../lib/db';
import Wallpaper from '@/app/models/Wallpaper';
import { uploadFile, deleteFile } from '@/app/lib/gridfs';
import MediaAsset from '@/models/MediaAsset';
import { Types } from 'mongoose';

// Define the type for the upload result
interface UploadResult {
  fileId: string;
  filename: string;
  contentType: string;
}

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Authentication required. Please log in.');
  }
  if (!session.user.isAdmin) {
    throw new Error('Unauthorized - Admin access required.');
  }
  return true;
}

// Helper function to validate file
async function validateFile(file: File) {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB');
  }
}

// Get all wallpapers
export async function GET(req: NextRequest) {
  try {
    // Check authentication first
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view wallpapers' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    
    // Add search condition if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const total = await Wallpaper.countDocuments(query);

    // Get wallpapers with pagination and populate mediaAssetId
    const wallpapers = await Wallpaper.find(query)
      .populate({
        path: 'mediaAssetId',
        select: 'gridfs_id_original gridfs_id_edited gridfs_id_compressed'
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    // Format response with mediaAssetId included
    const formattedWallpapers = wallpapers.map(wallpaper => ({
      _id: wallpaper._id,
      title: wallpaper.title,
      description: wallpaper.description,
      mediaAssetId: wallpaper.mediaAssetId,
      imageUrl: wallpaper.imageUrl,
      thumbnailUrl: wallpaper.thumbnailUrl,
      category: wallpaper.category,
      tags: wallpaper.tags,
      downloads: wallpaper.downloadCount || 0,
      viewCount: wallpaper.viewCount || 0,
      isPublished: wallpaper.isPublished,
      isHD: wallpaper.isHD,
      isNew: wallpaper.isNew,
      isTrending: wallpaper.isTrending,
      createdAt: wallpaper.createdAt,
      updatedAt: wallpaper.updatedAt
    }));

    return NextResponse.json({
      wallpapers: formattedWallpapers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching wallpapers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallpapers' },
      { status: 500 }
    );
  }
}

// Create a new wallpaper
export async function POST(req: NextRequest) {
  let savedMediaAssetId: Types.ObjectId | null = null;
  const uploadedGridfsIds: string[] = [];

  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin || !session.user.id) {
      return NextResponse.json(
        { error: 'Admin authentication required to create wallpapers' },
        { status: 403 }
      );
    }
    const uploader = session.user;

    // Get form data
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const resolutionStr = formData.get('resolution') as string;
    const tags = (formData.get('tags') as string || '').split(',').map(tag => tag.trim()).filter(Boolean);
    const isPublished = formData.get('isPublished') === 'true';
    const isHD = formData.get('isHD') === 'true';
    const isNew = formData.get('isNew') === 'true';
    const isTrending = formData.get('isTrending') === 'true';
    const uploadMode = formData.get('uploadMode') as ('cropped' | 'original') || 'cropped';
    const originalImage = formData.get('originalImage') as File;
    const croppedImage = uploadMode === 'cropped' ? formData.get('croppedImage') as File : null;
    const thumbnail = formData.get('thumbnail') as File;

    // Basic validation
    if (!title || !description || !category || !originalImage || !thumbnail || (uploadMode === 'cropped' && !croppedImage)) {
         return NextResponse.json({ error: 'Missing required fields or files' }, { status: 400 });
    }

    // File Validation
    try {
        await validateFile(originalImage);
        if (uploadMode === 'cropped' && croppedImage) await validateFile(croppedImage);
        await validateFile(thumbnail);
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid file' }, { status: 400 });
    }

    // Resolution parsing
    let resolutionObject: { width: number; height: number };
    let resolutionString: string | undefined = undefined;
    try {
      resolutionObject = JSON.parse(resolutionStr);
      if (!resolutionObject || typeof resolutionObject.width !== 'number' || typeof resolutionObject.height !== 'number') {
        throw new Error('Invalid resolution format object');
      }
      resolutionString = `${resolutionObject.width}x${resolutionObject.height}`;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid resolution format' }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // Prepare File Upload Promises
    const uploadPromises: Promise<UploadResult>[] = [];
    const imageToUseForWallpaper = uploadMode === 'cropped' && croppedImage ? croppedImage : originalImage;

    uploadPromises.push(uploadFile(
      Buffer.from(await originalImage.arrayBuffer()),
      `original-${Date.now()}-${originalImage.name}`,
      originalImage.type
    ));
    uploadPromises.push(uploadFile(
        Buffer.from(await thumbnail.arrayBuffer()),
        `thumbnail-${Date.now()}-${thumbnail.name}`,
        thumbnail.type
    ));
    let croppedUploadPromiseIndex: number | null = null;
    if (uploadMode === 'cropped' && croppedImage) {
        croppedUploadPromiseIndex = uploadPromises.length;
        uploadPromises.push(uploadFile(
            Buffer.from(await croppedImage.arrayBuffer()),
            `cropped-${Date.now()}-${croppedImage.name}`,
            croppedImage.type
        ));
    }

    // Upload files (Await directly, error will be caught by outer catch)
    console.log('Starting file uploads to GridFS...');
    const results = await Promise.all(uploadPromises);
    console.log('Files uploaded successfully to GridFS');

    // Assign results
    const originalUpload: UploadResult = results[0];
    const thumbnailUpload: UploadResult = results[1]; 
    let croppedUpload: UploadResult | null = null;
    if (croppedUploadPromiseIndex !== null) {
        croppedUpload = results[croppedUploadPromiseIndex];
    }

    // Create MediaAsset
    console.log('Creating MediaAsset document...');
    const newMediaAsset = new MediaAsset({
      gridfs_id_original: new Types.ObjectId(originalUpload.fileId),
      filename_original: originalUpload.filename,
      mimeType: originalUpload.contentType,
      size_original: originalImage.size,
      resolution: resolutionString,
      type: 'wallpaper',
      tags: tags,
      uploaderId: new Types.ObjectId(uploader.id),
      uploaderName: uploader.name,
      uploaderEmail: uploader.email,
      gridfs_id_compressed: thumbnailUpload ? new Types.ObjectId(thumbnailUpload.fileId) : undefined,
      gridfs_id_edited: croppedUpload ? new Types.ObjectId(croppedUpload.fileId) : undefined,
      metadata: { 
        title: title,
      }
    });
    await newMediaAsset.save();
    savedMediaAssetId = newMediaAsset._id;
    uploadedGridfsIds.push(originalUpload.fileId);
    if (thumbnailUpload) uploadedGridfsIds.push(thumbnailUpload.fileId);
    if (croppedUpload) uploadedGridfsIds.push(croppedUpload.fileId);
    
    console.log('MediaAsset saved successfully with ID:', savedMediaAssetId);

    // Create Wallpaper document referencing the MediaAsset
    console.log('Creating Wallpaper document...');
    const newWallpaper = new Wallpaper({
      title: title,
      description: description,
      category: category,
      tags: tags,
      downloads: 0,
      viewCount: 0,
      isPublished: isPublished,
      isHD: isHD,
      isNew: isNew,
      isTrending: isTrending,
      resolution: resolutionString,
      mediaAssetId: newMediaAsset._id,
      uploadedBy: new Types.ObjectId(uploader.id),
      sortOrder: 0
    });
    await newWallpaper.save();
    console.log('Wallpaper saved successfully with ID:', newWallpaper._id);

    // Return the newly created wallpaper object
    return NextResponse.json(newWallpaper.toObject(), { status: 201 });

  } catch (error) {
    console.error('Error in wallpaper POST route:', error);
    
    // Cleanup: Delete uploaded files and media asset if they were created
    try {
      if (savedMediaAssetId) {
        console.log('Cleaning up: Deleting MediaAsset:', savedMediaAssetId);
        await MediaAsset.findByIdAndDelete(savedMediaAssetId);
      }
      
      // Delete uploaded GridFS files
      for (const fileId of uploadedGridfsIds) {
        console.log('Cleaning up: Deleting GridFS file:', fileId);
        await deleteFile(fileId);
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
      // Don't throw here, we want to return the original error
    }
    
    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
        status = 403;
      } else if (error.message.includes('Invalid file') || 
                 error.message.includes('Missing required') || 
                 error.message.includes('Invalid resolution format') ||
                 error.message.includes('validation failed') ||
                 error.message.includes('duplicate key')) {
        status = 400;
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected server error occurred during wallpaper creation' },
      { status: status } 
    );
  }
}

// Update a wallpaper
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update wallpapers' },
        { status: 403 }
      );
    }

    // Simplified: Parse only metadata from form data
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const resolution = formData.get('resolution') as string; // Keep resolution if it's metadata
    const tags = (formData.get('tags') as string || '').split(',').map(tag => tag.trim()).filter(Boolean); // Added tags update
    const isPublished = formData.get('isPublished') === 'true';
    const isHD = formData.get('isHD') === 'true'; // Added flag updates
    const isNew = formData.get('isNew') === 'true';
    const isTrending = formData.get('isTrending') === 'true';

    // Validate required fields
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Wallpaper ID is required' }, { status: 400 });
    }
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description and category are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update wallpaper metadata
    const updatedWallpaper = await Wallpaper.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          description,
          category,
          resolution, // Update resolution if provided
          tags, // Update tags
          isPublished,
          isHD,
          isNew,
          isTrending,
          // Do not update imageUrl, thumbnailUrl, mediaAssetId, etc. here
        }
      },
      { new: true } // Return the updated document
    );

    if (!updatedWallpaper) {
      return NextResponse.json(
        { error: 'Wallpaper not found or failed to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Wallpaper metadata updated successfully',
      wallpaper: updatedWallpaper,
    });

  } catch (error) {
    console.error('Error updating wallpaper metadata:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: `Failed to update wallpaper metadata: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Delete a wallpaper
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete wallpapers' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Valid Wallpaper ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const wallpaper = await Wallpaper.findById(id).populate('mediaAssetId');

    if (!wallpaper) {
      return NextResponse.json(
        { error: 'Wallpaper not found' },
        { status: 404 }
      );
    }

    // --- Start Deletion Logic ---
    const mediaAssetId = wallpaper.mediaAssetId as Types.ObjectId;
    
    // Delete related MediaAsset and GridFS files if they exist
    if (mediaAssetId) {
      const mediaAsset = await MediaAsset.findById(mediaAssetId);
      if (mediaAsset) {
        const gridfsIdsToDelete = [
          mediaAsset.gridfs_id_original?.toString(),
          mediaAsset.gridfs_id_compressed?.toString(),
          mediaAsset.gridfs_id_edited?.toString()
        ].filter(Boolean) as string[]; // Filter out null/undefined

        console.log(`Deleting GridFS files for MediaAsset ${mediaAssetId}:`, gridfsIdsToDelete);

        // Attempt to delete all associated GridFS files
        const deletePromises = gridfsIdsToDelete.map(fileId => 
          deleteFile(fileId).catch(err => {
            console.error(`Failed to delete GridFS file ${fileId} for MediaAsset ${mediaAssetId}:`, err);
            // Decide if you want to throw or just log the error
          })
        );
        await Promise.all(deletePromises);

        // Delete the MediaAsset document itself
        await MediaAsset.findByIdAndDelete(mediaAssetId);
        console.log(`Deleted MediaAsset document ${mediaAssetId}`);
      } else {
        console.warn(`MediaAsset document not found for ID: ${mediaAssetId}, referenced by Wallpaper ${id}`);
      }
    }

    // Delete the Wallpaper document
    await Wallpaper.findByIdAndDelete(id);
    console.log(`Deleted Wallpaper document ${id}`);

    return NextResponse.json({
      message: 'Wallpaper and associated assets deleted successfully',
    });
    // --- End Deletion Logic ---

  } catch (error) {
    console.error('Error deleting wallpaper:', error);
    // Improved error reporting
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: `Failed to delete wallpaper: ${errorMessage}` },
      { status: 500 }
    );
  }
} 