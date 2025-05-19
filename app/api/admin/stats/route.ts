import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import Blog from '@/app/models/Blog';
import Wallpaper from '@/app/models/Wallpaper';
import CraftlandCode from '@/app/models/CraftlandCode';
import { User } from '@/app/models/User';
import RedeemCode from '@/app/models/RedeemCode';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Get counts from all models
    const [
      userCount,
      blogCount,
      wallpaperCount,
      craftlandCodeCount,
      redeemCodeCount
    ] = await Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
      Wallpaper.countDocuments(),
      CraftlandCode.countDocuments(),
      RedeemCode.countDocuments()
    ]);

    return NextResponse.json({
      users: userCount,
      blogs: blogCount,
      wallpapers: wallpaperCount,
      craftlandCodes: craftlandCodeCount,
      redeemCodes: redeemCodeCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
} 