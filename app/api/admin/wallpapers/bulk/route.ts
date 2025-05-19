import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import connectDB from '@/app/lib/mongodb';
import Wallpaper from '@/app/models/Wallpaper';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, wallpaperIds } = await req.json();

    if (!action || !wallpaperIds || !Array.isArray(wallpaperIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await connectDB();

    switch (action) {
      case 'publish':
        await Wallpaper.updateMany(
          { _id: { $in: wallpaperIds } },
          { $set: { isPublished: true } }
        );
        break;
      
      case 'unpublish':
        await Wallpaper.updateMany(
          { _id: { $in: wallpaperIds } },
          { $set: { isPublished: false } }
        );
        break;
      
      case 'delete':
        await Wallpaper.deleteMany({ _id: { $in: wallpaperIds } });
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 