import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import Media, { IMedia } from '@/models/Media'; // Adjust path
import { initializeGridFS, deleteGridFSFile } from '@/lib/gridfs'; // Adjust path
import mongoose from 'mongoose';

interface RouteContext {
    params: {
        slug: string;
    };
}

// --- PATCH Handler (Update Metadata) ---
export async function PATCH(req: NextRequest, { params }: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { slug } = params;
    if (!slug) {
        return NextResponse.json({ error: 'Missing media slug' }, { status: 400 });
    }

    try {
        await dbConnect();
        const body = await req.json();

        // Fields allowed to be updated
        const updateData: Partial<Pick<IMedia, 'filename' | 'caption' | 'altText'>> = {};
        if (body.filename) updateData.filename = body.filename;
        if (body.caption !== undefined) updateData.caption = body.caption; // Allow empty string
        if (body.altText !== undefined) updateData.altText = body.altText; // Allow empty string

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
        }

        const updatedMedia = await Media.findOneAndUpdate(
            { slug: slug },
            { $set: updateData },
            { new: true, runValidators: true } // Return updated doc, run schema validators
        ).lean({ virtuals: true });

        if (!updatedMedia) {
            return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, media: updatedMedia });

    } catch (error: any) {
        console.error(`Error updating media [${slug}]:`, error);
         if (error instanceof mongoose.Error.ValidationError) {
             return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
         }
        return NextResponse.json({ error: 'Internal server error updating media.' }, { status: 500 });
    }
}


// --- DELETE Handler ---
export async function DELETE(req: NextRequest, { params }: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { slug } = params;
    if (!slug) {
        return NextResponse.json({ error: 'Missing media slug' }, { status: 400 });
    }

    try {
        await dbConnect();
        initializeGridFS(); // Ensure GridFS is ready for deletion

        // 1. Find the metadata document to get the GridFS ID
        const mediaItem = await Media.findOne({ slug: slug });

        if (!mediaItem) {
            return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
        }

        const gridFsId = mediaItem.gridFsId;

        // 2. Delete the file from GridFS
        await deleteGridFSFile(gridFsId);

        // 3. Delete the metadata document from Mongoose
        await Media.deleteOne({ slug: slug });

        return NextResponse.json({ success: true, message: 'Media item deleted successfully' });

    } catch (error: any) {
        console.error(`Error deleting media [${slug}]:`, error);
        // Check if the error is because the file was already deleted from GridFS
         if (error.message.includes('FileNotFound')) {
             // If GridFS file is gone, maybe still delete metadata? Decide on behavior.
             console.warn(`GridFS file for slug ${slug} was not found during deletion, but attempting to delete metadata.`);
             try {
                 await Media.deleteOne({ slug: slug });
                 return NextResponse.json({ success: true, message: 'Media item metadata deleted (GridFS file was already missing)' });
             } catch (metaError: any) {
                  console.error(`Error deleting media metadata for ${slug} after GridFS file not found:`, metaError);
                  return NextResponse.json({ error: 'Error deleting media metadata after GridFS file was missing.' }, { status: 500 });
             }
         }
        return NextResponse.json({ error: 'Internal server error deleting media.' }, { status: 500 });
    }
} 