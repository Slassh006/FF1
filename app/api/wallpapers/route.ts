import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Wallpaper from '@/app/models/Wallpaper';
import '@/models/MediaAsset';
import { formatWallpaperResponse, seededShuffle } from '@/app/utils/wallpaperUtils';
import { Types } from 'mongoose';

const PINNED_COUNT = 4; // Number of latest wallpapers to pin
const ITEMS_PER_PAGE = 20; // Define limit consistently

export async function GET(request: NextRequest) {
  const start = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || ITEMS_PER_PAGE.toString());
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  console.log(`[API/WALLPAPERS/GET Start] Req: page=${page}, limit=${limit}, search="${search}", category="${category}"`);

  try {
    // Step 1: Connect DB
    console.log("[API/WALLPAPERS/GET] Connecting to DB...");
    await connectDB();
    console.log("[API/WALLPAPERS/GET] DB Connected.");

    // Step 2: Build Match Query
    const matchQuery: any = { isPublished: true };
    if (search) {
      matchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      matchQuery.category = category;
    }
    console.log("[API/WALLPAPERS/GET] Built match query:", JSON.stringify(matchQuery));

    // Step 3: Fetch Pinned Wallpapers
    console.log('[API/WALLPAPERS/GET] Fetching pinned wallpapers...');
    const pinnedWallpapers = await Wallpaper.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(PINNED_COUNT)
      .populate({
        path: 'mediaAssetId',
        select: 'imageUrl thumbnailUrl gridfs_id_original gridfs_id_compressed gridfs_id_edited'
      })
      .lean();
    console.log(`[API/WALLPAPERS/GET] Found ${pinnedWallpapers.length} pinned wallpapers`);
    const pinnedIds = pinnedWallpapers.map(w => w?._id?.toString()).filter(Boolean) as string[];

    // Step 4: Fetch Older Wallpaper IDs
    console.log('[API/WALLPAPERS/GET] Fetching older wallpaper IDs...');
    const olderWallpapersCursor = Wallpaper.find({
      ...matchQuery,
      _id: { $nin: pinnedIds.map(id => new Types.ObjectId(id)) }
    })
    .select({ _id: 1 })
    .lean();
    const olderWallpaperIds = (await olderWallpapersCursor).map(w => w?._id?.toString()).filter(Boolean) as string[];
    console.log(`[API/WALLPAPERS/GET] Found ${olderWallpaperIds.length} older wallpaper IDs`);

    // Step 5: Shuffle Older IDs (Wrap in try-catch in case utility fails)
    let shuffledOlderIds: string[] = [];
    try {
      const dailySeed = new Date().toISOString().slice(0, 10);
      shuffledOlderIds = seededShuffle<string>(olderWallpaperIds, dailySeed);
      console.log("[API/WALLPAPERS/GET] Shuffled older IDs.");
    } catch (shuffleError) {
      console.error("[API/WALLPAPERS/GET] Error during shuffle:", shuffleError);
      // Fallback: use unshuffled order if shuffle fails
      shuffledOlderIds = olderWallpaperIds;
    }
    
    // Step 6: Calculate pagination slices
    const totalCount = pinnedWallpapers.length + olderWallpaperIds.length;
    const skip = (page - 1) * limit;
    let neededPinned: any[] = [];
    let olderIdsToFetchStrings: string[] = [];
    if (skip < pinnedWallpapers.length) {
      neededPinned = pinnedWallpapers.slice(skip, skip + limit);
    }
    const neededOlderCount = Math.max(0, limit - neededPinned.length);
    const olderSkip = Math.max(0, skip - pinnedWallpapers.length);
    if (neededOlderCount > 0 && olderSkip < shuffledOlderIds.length) {
        olderIdsToFetchStrings = shuffledOlderIds.slice(olderSkip, olderSkip + neededOlderCount);
    }
    console.log(`[API/WALLPAPERS/GET] Calculated slices: need ${neededPinned.length} pinned, need ${olderIdsToFetchStrings.length} older.`);

    // Step 7: Fetch Older Wallpapers if needed
    let olderWallpapers: any[] = [];
    if (olderIdsToFetchStrings.length > 0) {
        console.log(`[API/WALLPAPERS/GET] Fetching ${olderIdsToFetchStrings.length} older wallpapers by ID...`);
        const olderObjectIdsToFetch = olderIdsToFetchStrings.map(id => new Types.ObjectId(id));
        
        // First verify which IDs exist
        const existingIds = await Wallpaper.find(
          { _id: { $in: olderObjectIdsToFetch } },
          { _id: 1 }
        ).lean();
        
        const existingIdStrings = existingIds.map(doc => (doc._id as Types.ObjectId).toString());
        const missingIds = olderIdsToFetchStrings.filter(id => !existingIdStrings.includes(id));
        
        if (missingIds.length > 0) {
            console.warn(`[API/WALLPAPERS/GET] Some requested wallpaper IDs do not exist:`, missingIds);
        }
        
        // Only fetch existing wallpapers
        olderWallpapers = await Wallpaper.find({ _id: { $in: olderObjectIdsToFetch } })
          .populate({
            path: 'mediaAssetId',
            select: 'imageUrl thumbnailUrl gridfs_id_original gridfs_id_compressed gridfs_id_edited'
          })
          .lean();
        
        // Re-sort based on shuffled order and handle missing IDs
        const olderWallpapersMap = new Map(olderWallpapers.map(w => [w._id.toString(), w]));
        olderWallpapers = olderIdsToFetchStrings
          .map(id => olderWallpapersMap.get(id))
          .filter((w): w is NonNullable<typeof w> => w !== undefined);
        
        console.log(`[API/WALLPAPERS/GET] Fetched ${olderWallpapers.length} older wallpapers. ${missingIds.length} IDs were not found.`);
    }

    // Step 8: Combine and Prepare Response
    const finalWallpapers = [...neededPinned, ...olderWallpapers];
    const hasMore = page * limit < totalCount;
    const duration = Date.now() - start;
    console.log(`[API/WALLPAPERS/GET Success] Req: page=${page}, limit=${limit}. Found ${totalCount} total. Returning ${finalWallpapers.length}. hasMore=${hasMore}. Duration: ${duration}ms`);

    return NextResponse.json({
      wallpapers: finalWallpapers, 
      hasMore: hasMore,
      pagination: {
        total: totalCount,
        page: page,
        limit: limit,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[API/WALLPAPERS/GET Error] Req: page=${page}, limit=${limit}, search="${search}", category="${category}". Duration: ${duration}ms`, error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'CastError' || error.message.includes('ObjectId')) {
        return NextResponse.json(
          { error: 'Invalid ID format in request' },
          { status: 400 }
        );
      }
      if (error.message.includes('database connection')) {
        return NextResponse.json(
          { error: 'Database connection error' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch wallpapers due to an internal error.' }, 
      { status: 500 }
    );
  }
} 