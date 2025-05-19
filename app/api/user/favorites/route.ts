import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import UserModel from '@/models/User';

// GET /api/user/favorites?type=craftland
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        await dbConnect();
        const user = await UserModel.findById(userId).select('favoriteCraftlandCodes savedWallpapers').lean(); // Select relevant fields

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let favorites: string[] = [];
        if (type === 'craftland') {
            favorites = user.favoriteCraftlandCodes?.map(id => id.toString()) || [];
        } else if (type === 'wallpaper') {
            favorites = user.savedWallpapers?.map(id => id.toString()) || [];
        }
        // Add other types if needed

        return NextResponse.json({ success: true, favorites });

    } catch (error) {
        console.error('[API User Favorites GET Error]', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch favorites';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 