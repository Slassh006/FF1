import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Wallpaper from '@/app/models/Wallpaper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Check if this is an admin request
    let isAdmin = false;
    try {
      await checkAdminAuth();
      isAdmin = true;
    } catch (error) {
      // Not an admin request, continue with public access
    }
    
    console.log(`[API/WALLPAPERS/[ID]/GET] Fetching wallpaper with ID: ${params.id}`);
    
    // Find the wallpaper with populated mediaAssetId
    const wallpaper = await Wallpaper.findOne({
      _id: params.id,
      isPublished: true
    }).populate({
      path: 'mediaAssetId',
      select: 'imageUrl thumbnailUrl gridfs_id_original gridfs_id_compressed gridfs_id_edited'
    });
    
    if (!wallpaper) {
      console.log(`[API/WALLPAPERS/[ID]/GET] Wallpaper not found: ${params.id}`);
      return NextResponse.json({ error: 'Wallpaper not found' }, { status: 404 });
    }
    
    // Log the wallpaper data for debugging
    console.log(`[API/WALLPAPERS/[ID]/GET] Wallpaper found:`, {
      id: wallpaper._id,
      title: wallpaper.title,
      hasMediaAssetId: !!wallpaper.mediaAssetId,
      mediaAssetIdType: wallpaper.mediaAssetId ? typeof wallpaper.mediaAssetId : 'null',
      mediaAssetIdKeys: wallpaper.mediaAssetId ? Object.keys(wallpaper.mediaAssetId) : [],
      imageUrl: wallpaper.imageUrl,
      thumbnailUrl: wallpaper.thumbnailUrl
    });
    
    // Increment view count
    wallpaper.viewCount = (wallpaper.viewCount || 0) + 1;
    await wallpaper.save();
    
    // Return response based on whether it's an admin request
    if (isAdmin) {
      return NextResponse.json({ wallpaper });
    } else {
      return NextResponse.json(wallpaper);
    }
  } catch (error) {
    console.error('[API/WALLPAPERS/[ID]/GET] Error fetching wallpaper:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 