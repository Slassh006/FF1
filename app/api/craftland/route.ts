import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import CraftlandCode from '@/app/models/CraftlandCode';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

// YouTube URL Validation Regex (same as frontend)
const YOUTUBE_REGEX = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;

const validateYouTubeUrl = (url: string): boolean => {
  if (!url) return true; // Allow empty URL (optional field)
  return YOUTUBE_REGEX.test(url);
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions); // Get session to check role
    const isAdmin = session?.user?.role === 'admin';

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const region = searchParams.get('region');
    const sort = searchParams.get('sort') || 'newest';

    const skip = (page - 1) * limit;
    let query: any = {};

    if (category) query.category = category;
    if (region) query.region = region;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply visibility filters for non-admins
    if (!isAdmin) {
        query.isVerified = true;
        query.status = 'approved';
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'votes') {
      // Note: Sorting by votes requires calculating net votes. Ensure upvotes/downvotes fields exist.
      sortOption = { netVotes: -1 }; // Requires a field or aggregation for net votes
      // Alternative using expression (might be less performant without index):
      // sortOption = { $expr: { $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] } };
      // Consider adding a dedicated 'netVotes' field updated on vote for better performance.
    } else if (sort === 'likes') {
        // Note: Sorting by likes requires the 'likes' field which is an array.
      sortOption = { likesCount: -1 }; // Requires a field or aggregation for likes count
      // Alternative using expression (might be less performant without index):
      // sortOption = { $expr: { $size: '$likes' } };
      // Consider adding a dedicated 'likesCount' field updated on like for better performance.
    }

    // Fetch craftland codes with populated creator
    const craftlandCodes = await CraftlandCode.find(query)
      // Select necessary fields, removed thumbnailUrl
      .select('code title description category creator createdAt imageUrl upvotes downvotes likes isVerified region status')
      .populate('creator', 'name avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const transformedCodes = craftlandCodes.map(code => {
      const populatedCreator = code.creator as any;
      const creatorInfo = populatedCreator ? {
        _id: populatedCreator._id?.toString() || null,
        name: populatedCreator.name || 'Unknown Creator',
        image: populatedCreator.avatar || null
      } : {
        _id: null,
        name: 'Unknown Creator',
        image: null
      };

      return {
        ...code,
        creator: creatorInfo,
        // Optionally add computed fields if needed by frontend
        // upvotesCount: code.upvotes?.length || 0,
        // downvotesCount: code.downvotes?.length || 0,
        // likesCount: code.likes?.length || 0,
      };
    });

    const total = await CraftlandCode.countDocuments(query);

    return NextResponse.json({
      success: true,
      craftlandCodes: transformedCodes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching craftland codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch craftland codes' },
      { status: 500 }
    );
  }
}

// Removed the conflicting POST handler entirely 