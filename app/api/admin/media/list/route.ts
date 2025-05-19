import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Adjust path
import dbConnect from '@/app/lib/dbConnect'; // Adjust path
import Media, { IMedia } from '@/models/Media'; // Adjust path
import { MediaFilters, MediaPagination } from '@/types/media'; // Adjust path

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);

        // Extract and parse filters from query parameters
        const filters: MediaFilters = {};
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '12', 10); // Default items per page
        filters.type = searchParams.get('type') as MediaFilters['type'] || '';
        filters.search = searchParams.get('search') || '';
        filters.sortBy = searchParams.get('sortBy') || 'uploadDate';
        filters.sortOrder = searchParams.get('sortOrder') as MediaFilters['sortOrder'] || 'desc';

        const skip = (page - 1) * limit;

        // Build Mongoose query
        const query: any = {};

        if (filters.type) {
            // Map simple types to MIME type patterns
            let typeRegex;
            switch (filters.type) {
                case 'image': typeRegex = /^image\//; break;
                case 'video': typeRegex = /^video\//; break;
                case 'document': typeRegex = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt$/i; break; // Example docs
                // Add more cases or adjust regex as needed
                default: break;
            }
            if (typeRegex) query.type = { $regex: typeRegex };
        }

        if (filters.search) {
            const searchRegex = { $regex: filters.search, $options: 'i' };
            query.$or = [
                { filename: searchRegex },
                { caption: searchRegex },
                { altText: searchRegex },
            ];
        }

        // Sorting
        const sortOptions: { [key: string]: 1 | -1 } = {};
        sortOptions[filters.sortBy] = filters.sortOrder === 'asc' ? 1 : -1;

        // Fetch data and total count
        const mediaItems = await Media.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean({ virtuals: true }); // Use lean for performance, include virtuals

        const totalItems = await Media.countDocuments(query);

        const totalPages = Math.ceil(totalItems / limit);
        const pagination: MediaPagination = {
            page,
            perPage: limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };

        return NextResponse.json({ success: true, media: mediaItems, pagination });

    } catch (error: any) {
        console.error('Error fetching media list:', error);
        return NextResponse.json({ error: 'Internal server error fetching media list.' }, { status: 500 });
    }
} 