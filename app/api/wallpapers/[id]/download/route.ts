import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getFile } from '@/app/lib/gridfs';
import Wallpaper from '@/app/models/Wallpaper';

const VALID_RESOLUTIONS = ['mobile', 'desktop', 'original'] as const;
type Resolution = typeof VALID_RESOLUTIONS[number];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { resolution } = await request.json();

    if (!id || !resolution) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!VALID_RESOLUTIONS.includes(resolution as Resolution)) {
      return NextResponse.json(
        { error: `Invalid resolution. Must be one of: ${VALID_RESOLUTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Get the wallpaper with populated mediaAssetId
    const wallpaper = await Wallpaper.findById(id).populate('mediaAssetId');
    if (!wallpaper) {
      return NextResponse.json(
        { error: 'Wallpaper not found' },
        { status: 404 }
      );
    }

    // Check if mediaAssetId is populated
    if (!wallpaper.mediaAssetId || typeof wallpaper.mediaAssetId !== 'object') {
      return NextResponse.json(
        { error: 'Media asset not found for this wallpaper' },
        { status: 404 }
      );
    }

    // Get the mediaAsset object
    const mediaAsset = wallpaper.mediaAssetId as any;

    // Determine which file to use based on resolution
    let fileId: string | undefined;
    
    // Log the available properties for debugging
    console.log('Media asset properties:', {
      id: mediaAsset._id,
      hasImageUrl: 'imageUrl' in mediaAsset,
      hasThumbnailUrl: 'thumbnailUrl' in mediaAsset,
      hasOriginalImageUrl: 'originalImageUrl' in mediaAsset,
      hasGridfsIdOriginal: 'gridfs_id_original' in mediaAsset,
      hasGridfsIdCompressed: 'gridfs_id_compressed' in mediaAsset,
      hasGridfsIdEdited: 'gridfs_id_edited' in mediaAsset
    });

    switch (resolution) {
      case 'mobile':
        // Try to use compressed version if available, otherwise use original
        fileId = mediaAsset.gridfs_id_compressed || mediaAsset.gridfs_id_original;
        break;
      case 'desktop':
        // Try to use edited version if available, otherwise use original
        fileId = mediaAsset.gridfs_id_edited || mediaAsset.gridfs_id_original;
        break;
      case 'original':
        // Always use original for original resolution
        fileId = mediaAsset.gridfs_id_original;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid resolution' },
          { status: 400 }
        );
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID not found for the requested resolution' },
        { status: 404 }
      );
    }

    try {
      // Get the file from GridFS
      const { buffer, contentType } = await getFile(fileId.toString());

      // Update download count
      await Wallpaper.findByIdAndUpdate(id, {
        $inc: { downloads: 1 }
      });

      // Return the file
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${wallpaper.title}-${resolution}.${contentType.split('/')[1]}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
    } catch (error: any) {
      console.error('Error retrieving file:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to retrieve file from storage' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Download error:', error);
    
    if (error.message?.includes('File not found')) {
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to download wallpaper' },
      { status: 500 }
    );
  }
} 