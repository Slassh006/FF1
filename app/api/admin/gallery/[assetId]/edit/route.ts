import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/app/lib/dbConnect';
import MediaAsset, { IMediaAsset } from '@/models/MediaAsset'; // Ensure IMediaAsset is exported or define needed fields
import { uploadFile, deleteFile } from '@/lib/gridfs';
import { Types } from 'mongoose';

export async function PUT(request: Request, { params }: { params: { assetId: string } }) {
    const session = await getServerSession(authOptions);

    // 1. Authentication & Authorization
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Validate Asset ID
    const { assetId } = params;
    if (!Types.ObjectId.isValid(assetId)) {
        return NextResponse.json({ error: 'Invalid Asset ID format' }, { status: 400 });
    }

    let oldEditedFileId: Types.ObjectId | undefined | null = null;
    let newEditedFileId: Types.ObjectId | null = null;

    try {
        // 3. Parse FormData and Validate File
        const formData = await request.formData();
        const croppedImageFile = formData.get('croppedImage') as File | null;

        if (!croppedImageFile) {
            return NextResponse.json({ error: 'Missing cropped image data' }, { status: 400 });
        }
        if (!croppedImageFile.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Uploaded file must be an image' }, { status: 400 });
        }
         // Add size validation if needed
         // if (croppedImageFile.size > MAX_SIZE) { ... }

        // 4. Database Connection
        await dbConnect();

        // 5. Find Media Asset
        const mediaAsset = await MediaAsset.findById(assetId);
        if (!mediaAsset) {
            return NextResponse.json({ error: 'Media Asset not found' }, { status: 404 });
        }

        // Store the old ID for potential deletion later
        oldEditedFileId = mediaAsset.gridfs_id_edited;

        // 6. Upload New Edited File to GridFS
        const imageBuffer = Buffer.from(await croppedImageFile.arrayBuffer());
        // Ensure filename is somewhat unique and indicates edit
        const newFilename = `edited-${Date.now()}-${mediaAsset.filename_original?.replace(/[^a-zA-Z0-9.]/g, '_') || 'image.jpg'}`;

        console.log(`Uploading edited file: ${newFilename}, Type: ${croppedImageFile.type}`);
        const uploadResult = await uploadFile(
            imageBuffer,
            newFilename,
            croppedImageFile.type
        );
        
        if (!uploadResult || !uploadResult.fileId) {
             throw new Error('Failed to upload cropped image to GridFS');
        }
        newEditedFileId = new Types.ObjectId(uploadResult.fileId);
        console.log(`New edited file GridFS ID: ${newEditedFileId}`);


        // 7. Update MediaAsset Document
        mediaAsset.gridfs_id_edited = newEditedFileId;
        // Timestamps should be handled automatically by mongoose {timestamps: true}
        // mediaAsset.updatedAt = new Date(); 
        
        const updatedAsset = await mediaAsset.save();

        // --- Cleanup Step (After successful save) ---
        // 8. (Optional) Delete Old Edited File from GridFS
        if (oldEditedFileId) {
             try {
                 console.log(`Deleting old edited file GridFS ID: ${oldEditedFileId.toString()}`);
                 await deleteFile(oldEditedFileId.toString());
             } catch (deleteError) {
                 // Log error but don't fail the request, as the main operation succeeded
                 console.warn(`Could not delete old edited GridFS file ${oldEditedFileId.toString()}:`, deleteError);
             }
         }
         // --- End Cleanup ---

        // 9. Return Success Response
        return NextResponse.json({
            message: 'Image successfully cropped and updated',
            asset: { // Return relevant updated data
                 _id: updatedAsset._id,
                 gridfs_id_original: updatedAsset.gridfs_id_original,
                 gridfs_id_edited: updatedAsset.gridfs_id_edited,
                 updatedAt: updatedAsset.updatedAt,
             }
        }, { status: 200 });

    } catch (error: any) {
        console.error(`Error processing cropped image for asset ${assetId}:`, error);

        // --- Error Cleanup --- 
        // If the new file was uploaded but DB update failed, delete the new file
         if (newEditedFileId) {
             try {
                 console.warn(`Rolling back: Deleting newly uploaded edited file ${newEditedFileId.toString()} due to error...`);
                 await deleteFile(newEditedFileId.toString());
             } catch (cleanupError) {
                 console.error(`Failed to delete newly uploaded edited file ${newEditedFileId.toString()} during error rollback:`, cleanupError);
             }
         }
         // --- End Error Cleanup --- 

        return NextResponse.json(
            { error: error.message || 'Failed to process cropped image' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: { assetId: string } }) {
    const session = await getServerSession(authOptions);

    // 1. Authentication & Authorization
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Validate Asset ID
    const { assetId } = params;
    if (!Types.ObjectId.isValid(assetId)) {
        return NextResponse.json({ error: 'Invalid Asset ID format' }, { status: 400 });
    }

    try {
        // 3. Database Connection
        await dbConnect();

        // 4. Find Media Asset
        const mediaAsset = await MediaAsset.findById(assetId);
        if (!mediaAsset) {
            return NextResponse.json({ error: 'Media Asset not found' }, { status: 404 });
        }

        // 5. Check if there is an edited version to restore from
        const editedFileId = mediaAsset.gridfs_id_edited;
        if (!editedFileId) {
            return NextResponse.json({ message: 'No edited version found to restore from.' }, { status: 200 }); // No action needed
        }

        // 6. Update MediaAsset Document: Set edited ID to null
        mediaAsset.gridfs_id_edited = undefined; // Mongoose handles removing the field if set to undefined
        mediaAsset.markModified('gridfs_id_edited'); // Might be needed if schema doesn't auto-detect undefined change
        const updatedAsset = await mediaAsset.save();

        // 7. Delete the Edited File from GridFS (after successful DB update)
        try {
            console.log(`Restoring original: Deleting edited file GridFS ID: ${editedFileId.toString()}`);
            await deleteFile(editedFileId.toString());
        } catch (deleteError) {
            // Log error but don't fail the request, as the main DB operation succeeded
            console.warn(`Could not delete edited GridFS file ${editedFileId.toString()} during restore:`, deleteError);
        }

        // 8. Return Success Response
        return NextResponse.json({
            message: 'Successfully restored original image version.',
            asset: {
                _id: updatedAsset._id,
                gridfs_id_edited: updatedAsset.gridfs_id_edited, // Should be null/undefined
                updatedAt: updatedAsset.updatedAt,
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error(`Error restoring original for asset ${assetId}:`, error);
        return NextResponse.json(
            { error: error.message || 'Failed to restore original version' },
            { status: 500 }
        );
    }
} 