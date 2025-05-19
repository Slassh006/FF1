import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Wallpaper from '@/app/models/Wallpaper';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // First get manually marked trending wallpapers
    const manualTrending = await Wallpaper.find({ 
      isPublished: true,
      isTrending: true 
    })
    .sort({ 
      downloads: -1,
      likes: -1,
      createdAt: -1 
    })
    .limit(5)
    .select('_id title imageUrl thumbnailUrl category tags resolution downloads likes createdAt isHD');

    // If we have enough manual trending wallpapers, return them
    if (manualTrending.length >= 5) {
      // Ensure all image URLs are properly formatted
      const formattedWallpapers = manualTrending.map(w => ({
        ...w.toObject(),
        imageUrl: w.imageUrl.startsWith('/') || w.imageUrl.startsWith('http') 
          ? w.imageUrl 
          : `/api/images/${w.imageUrl}`,
        thumbnailUrl: w.thumbnailUrl.startsWith('/') || w.thumbnailUrl.startsWith('http')
          ? w.thumbnailUrl
          : `/api/images/${w.thumbnailUrl}`
      }));
      return NextResponse.json({ wallpapers: formattedWallpapers });
    }

    // Otherwise, get additional auto-trending wallpapers based on metrics
    const autoTrending = await Wallpaper.find({ 
      isPublished: true,
      isTrending: false,
      _id: { $nin: manualTrending.map(w => w._id) }
    })
    .sort({ 
      downloads: -1,
      likes: -1,
      createdAt: -1 
    })
    .limit(5 - manualTrending.length)
    .select('_id title imageUrl thumbnailUrl category tags resolution downloads likes createdAt isHD');

    // Combine manual and auto trending wallpapers
    const allWallpapers = [...manualTrending, ...autoTrending];

    // Format all wallpapers
    const formattedWallpapers = allWallpapers.map(w => ({
      ...w.toObject(),
      imageUrl: w.imageUrl.startsWith('/') || w.imageUrl.startsWith('http') 
        ? w.imageUrl 
        : `/api/images/${w.imageUrl}`,
      thumbnailUrl: w.thumbnailUrl.startsWith('/') || w.thumbnailUrl.startsWith('http')
        ? w.thumbnailUrl
        : `/api/images/${w.thumbnailUrl}`
    }));

    return NextResponse.json({ wallpapers: formattedWallpapers });
  } catch (error) {
    console.error('Error fetching trending wallpapers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending wallpapers' },
      { status: 500 }
    );
  }
} 