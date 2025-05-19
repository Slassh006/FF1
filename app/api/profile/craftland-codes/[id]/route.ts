import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { connectDB } from '@/app/lib/db';
import CraftlandCode from '@/app/models/CraftlandCode';
import { uploadFile, deleteFile } from '@/app/lib/gridfs'; // Use GridFS for file handling
import mongoose from 'mongoose';
import { ApiError } from '@/app/lib/api';

// --- Helper function for authorization ---
async function authorizeOwner(id: string, userId: string): Promise<mongoose.Document<unknown, {}, ICraftlandCode> & ICraftlandCode | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid submission ID format');
    }
    const submission = await CraftlandCode.findById(id);
    if (!submission) {
        throw new ApiError(404, 'Submission not found');
    }
    // Ensure submittedBy is compared as strings or ObjectIds consistently
    if (submission.submittedBy?.toString() !== userId) {
        throw new ApiError(403, 'Forbidden: You do not own this submission');
    }
    return submission;
}

// --- PATCH Handler (Update User's Submission) ---
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const submissionId = params.id;

    try {
        await connectDB();
        const existingSubmission = await authorizeOwner(submissionId, userId);

        const formData = await req.formData();
        const updateData: { [key: string]: any } = {};

        // Fields users are allowed to update
        const allowedFields = ['title', 'description', 'category', 'region', 'difficulty', 'code']; // Add 'code' if users can edit it

        allowedFields.forEach(field => {
            if (formData.has(field)) {
                updateData[field] = formData.get(field) as string;
            }
        });

        // Handle tags separately
        if (formData.has('tags')) {
            const tagsString = formData.get('tags') as string | null;
            updateData['tags'] = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];
        }

        // Handle potential file update
        const coverImageFile = formData.get('coverImage') as File | null;
        let oldImageId: string | undefined = existingSubmission.coverImageId;

        if (coverImageFile && coverImageFile.size > 0) {
            // Validate new file
            if (!coverImageFile.type.startsWith('image/')) {
                throw new ApiError(400, 'Invalid cover image file type.');
            }
            // Optional: Size check
            // if (coverImageFile.size > MAX_FILE_SIZE) { throw new ApiError(400, 'File too large'); }

            // Upload new file via GridFS
            const coverBuffer = Buffer.from(await coverImageFile.arrayBuffer());
            const filename = `craftland-user-${Date.now()}-${coverImageFile.name}`;
            const contentType = coverImageFile.type;
            const coverUploadResult = await uploadFile(coverBuffer, filename, contentType);

            if (!coverUploadResult?.fileId) {
                throw new ApiError(500, 'Cover image upload failed.');
            }
            
            updateData['coverImage'] = `/api/files/${coverUploadResult.fileId}`;
            updateData['coverImageId'] = coverUploadResult.fileId;
        }

        // Perform Update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'No update data provided.' }, { status: 400 });
        }

        const updatedSubmission = await CraftlandCode.findByIdAndUpdate(
            submissionId,
            { $set: updateData },
            { new: true, runValidators: true } // Return updated doc, run schema validation
        );

        if (!updatedSubmission) {
            throw new ApiError(404, 'Submission not found after update attempt');
        }

        // Delete old image only AFTER successful update and if a new image was uploaded
        if (coverImageFile && oldImageId) {
            try {
                await deleteFile(oldImageId);
                console.log(`Successfully deleted old image file ID: ${oldImageId}`);
            } catch (deleteError) {
                console.error(`Error deleting old image file ID ${oldImageId}:`, deleteError);
                // Log error but don't fail the request
            }
        }

        return NextResponse.json({ success: true, craftlandCode: updatedSubmission });

    } catch (error: any) {
        console.error(`Error updating submission ${submissionId}:`, error);
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        if (error instanceof mongoose.Error.ValidationError) {
            const errors = Object.values(error.errors).map(el => el.message);
            return NextResponse.json({ error: `Validation failed: ${errors.join(', ')}` }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }
}

// --- DELETE Handler (Delete User's Submission) ---
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    const submissionId = params.id;

    try {
        await connectDB();
        const submissionToDelete = await authorizeOwner(submissionId, userId);
        const imageIdToDelete = submissionToDelete.coverImageId;

        // Delete database record first
        await CraftlandCode.findByIdAndDelete(submissionId);

        // Then delete the associated file from GridFS if it exists
        if (imageIdToDelete) {
            try {
                await deleteFile(imageIdToDelete);
                console.log(`Successfully deleted image file ID: ${imageIdToDelete}`);
            } catch (deleteError) {
                console.error(`Error deleting image file ID ${imageIdToDelete}:`, deleteError);
                // Log error, but the main record deletion succeeded
            }
        }

        return NextResponse.json({ success: true, message: 'Submission deleted successfully.' });

    } catch (error: any) {
        console.error(`Error deleting submission ${submissionId}:`, error);
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
    }
} 