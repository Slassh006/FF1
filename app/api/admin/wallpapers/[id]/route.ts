import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '../../../../lib/db';
import Wallpaper, { IWallpaper } from '@/app/models/Wallpaper';
import MediaAsset from '@/models/MediaAsset';
import { deleteFile } from '@/app/lib/gridfs';
import { Types } from 'mongoose';

// GET a single wallpaper by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const wallpaper = await Wallpaper.findById(params.id);
    
    if (!wallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }
    
    return NextResponse.json({ wallpaper });
  } catch (error) {
    console.error('Error fetching wallpaper:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// UPDATE a wallpaper
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.category) {
      return NextResponse.json({ 
        error: 'Title, description, and category are required' 
      }, { status: 400 });
    }

    // Validate title length
    if (body.title.length > 100) {
      return NextResponse.json({ 
        error: 'Title must be 100 characters or less' 
      }, { status: 400 });
    }

    // Validate description length
    if (body.description.length > 500) {
      return NextResponse.json({ 
        error: 'Description must be 500 characters or less' 
      }, { status: 400 });
    }

    // Validate category
    const validCategories = ['Free Fire', 'Characters', 'Weapons', 'Elite Pass', 'Maps'];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json({ 
        error: 'Invalid category' 
      }, { status: 400 });
    }
    
    // Find the existing wallpaper to preserve fields not being updated
    const existingWallpaper = await Wallpaper.findById(params.id);
    
    if (!existingWallpaper) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }
    
    // Prepare update object with only the fields that are being updated
    const updateData = {
      title: body.title,
      description: body.description,
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags : [],
      isPublished: Boolean(body.isPublished),
      isHD: Boolean(body.isHD),
      isNew: Boolean(body.isNew),
      isTrending: Boolean(body.isTrending),
      updatedAt: new Date()
    };
    
    // Find and update wallpaper
    const updatedWallpaper = await Wallpaper.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Wallpaper updated successfully',
      wallpaper: updatedWallpaper,
    });
  } catch (error) {
    console.error('Error updating wallpaper:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a wallpaper and its associated assets
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid Wallpaper ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    
    // 1. Find the full Wallpaper document first to access its fields reliably
    const wallpaperToDelete = await Wallpaper.findById(id);
    
    if (!wallpaperToDelete) {
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }
    
    // Get mediaAssetId before deleting the wallpaper document
    const mediaAssetId = wallpaperToDelete.mediaAssetId;
    let deletedGridfsFileIds: string[] = [];
    let mediaAssetDeleted = false;

    // 2. If there's an associated MediaAsset, delete its files and the asset itself
    if (mediaAssetId && Types.ObjectId.isValid(mediaAssetId)) {
        try {
            const mediaAsset = await MediaAsset.findById(mediaAssetId);
            if (mediaAsset) {
                const fileIdsToDelete: string[] = [];
                if (mediaAsset.gridfs_id_original) fileIdsToDelete.push(mediaAsset.gridfs_id_original.toString());
                if (mediaAsset.gridfs_id_compressed) fileIdsToDelete.push(mediaAsset.gridfs_id_compressed.toString());
                if (mediaAsset.gridfs_id_edited) fileIdsToDelete.push(mediaAsset.gridfs_id_edited.toString());
                if (mediaAsset.gridfs_id_thumbnail) fileIdsToDelete.push(mediaAsset.gridfs_id_thumbnail.toString());
                
                console.log(`[Wallpaper Delete] Attempting to delete GridFS files for MediaAsset ${mediaAssetId}:`, fileIdsToDelete);
                const deletePromises = fileIdsToDelete.map(fileId => 
                    deleteFile(fileId).then(() => fileId).catch(err => {
                        console.error(`[Wallpaper Delete] Failed to delete GridFS file ${fileId}:`, err);
                        return null;
                    })
                );
                const results = await Promise.allSettled(deletePromises);
                deletedGridfsFileIds = results
                    .filter(result => result.status === 'fulfilled' && result.value !== null)
                    .map(result => (result as PromiseFulfilledResult<string>).value);
                 console.log(`[Wallpaper Delete] Successfully deleted GridFS files:`, deletedGridfsFileIds);
                 
                await MediaAsset.findByIdAndDelete(mediaAssetId);
                mediaAssetDeleted = true;
                console.log(`[Wallpaper Delete] Deleted MediaAsset document ${mediaAssetId}`);
            } else {
                 console.warn(`[Wallpaper Delete] MediaAsset ${mediaAssetId} referenced by Wallpaper ${id} not found.`);
            }
        } catch (assetError) {
             console.error(`[Wallpaper Delete] Error processing MediaAsset ${mediaAssetId} for Wallpaper ${id}:`, assetError);
        }
    }
    
    // 5. Finally, delete the Wallpaper document itself using the instance method
    await wallpaperToDelete.deleteOne();
    console.log(`[Wallpaper Delete] Deleted Wallpaper document ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Wallpaper and associated assets deleted successfully',
      details: {
          wallpaperId: id,
          mediaAssetId: mediaAssetId?.toString() || null,
          mediaAssetDeleted: mediaAssetDeleted,
          deletedGridfsFileIds: deletedGridfsFileIds
      }
    });

  } catch (error) {
    console.error(`[Wallpaper Delete] Error deleting wallpaper ${id}:`, error);
    return NextResponse.json({ error: 'Internal server error during wallpaper deletion' }, { status: 500 });
  }
} 