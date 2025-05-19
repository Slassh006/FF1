import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Wallpaper from '@/models/Wallpaper';
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

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await checkAdminAuth();
    
    // Connect to database
    await connectDB();
    
    // Parse request body
    const { action, wallpaperIds } = await request.json();
    
    if (!action || !wallpaperIds || !Array.isArray(wallpaperIds) || wallpaperIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Action and wallpaperIds are required.' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'delete':
        result = await Wallpaper.deleteMany({ _id: { $in: wallpaperIds } });
        break;
      case 'publish':
        result = await Wallpaper.updateMany(
          { _id: { $in: wallpaperIds } },
          { $set: { isPublished: true } }
        );
        break;
      case 'unpublish':
        result = await Wallpaper.updateMany(
          { _id: { $in: wallpaperIds } },
          { $set: { isPublished: false } }
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: delete, publish, unpublish' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed ${result.modifiedCount || result.deletedCount} wallpapers`,
      result
    });
  } catch (error: any) {
    console.error('Bulk action error:', error);
    
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to perform bulk action: ${error.message}` },
      { status: 500 }
    );
  }
} 