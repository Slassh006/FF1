import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import Media from '@/models/Media';
import { getGridFSFile } from '@/app/lib/gridfs';
import { initializeGridFS, getBucket } from '@/lib/gridfs'; // Adjust path
import { Readable } from 'stream';

interface RouteContext {
    params: {
        slug: string;
    };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
    const { slug } = params;
    if (!slug) {
        // This route is usually hit by browsers/img tags, returning JSON might not be ideal
        // Return a 400 status code directly
        return new Response('Missing media slug', { status: 400 });
    }

    let mediaItem: any = null; // Declare mediaItem here to use in catch block

    try {
        await dbConnect();
        initializeGridFS(); // Ensure GridFS is ready

        mediaItem = await Media.findOne({ slug: slug }).lean(); // Use lean

        if (!mediaItem || !mediaItem.gridFsId) {
             return new Response('Media not found', { status: 404 });
        }

        const bucket = getBucket();
        const downloadStream = bucket.openDownloadStream(mediaItem.gridFsId);

        // Convert Node.js Readable stream to Web Stream for NextResponse
        const data = new ReadableStream({
            start(controller) {
                downloadStream.on('data', (chunk) => {
                    controller.enqueue(chunk); // Pass chunk to the browser
                });
                downloadStream.on('end', () => {
                    controller.close(); // Signal end of stream
                });
                downloadStream.on('error', (error) => {
                    console.error(`Stream error for ${slug}:`, error);
                    controller.error(error); // Signal error to the browser
                });
            },
            cancel() {
                downloadStream.destroy();
            }
        });

        // Set headers
        const headers = new Headers();
        headers.set('Content-Type', mediaItem.type);
        headers.set('Content-Length', mediaItem.size.toString());
        // Optional: Add Content-Disposition for forcing download
        // headers.set('Content-Disposition', `attachment; filename="${mediaItem.filename}"`);
        // Optional: Caching headers
        headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year

         return new NextResponse(data, { status: 200, headers });

    } catch (error: any) {
        console.error(`Error streaming media [${slug}]:`, error);
         // Distinguish between file not found and other errors
         if (error.name === 'FileNotFound' || (mediaItem && !mediaItem.gridFsId)) { // Check if mediaItem was found but gridFsId missing
            return new Response('Media file data not found', { status: 404 });
        }
        return new Response('Internal server error streaming media.', { status: 500 });
    }
} 