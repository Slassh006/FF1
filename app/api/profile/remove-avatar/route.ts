import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { deleteFile, fileExists } from '@/app/lib/gridfs';
import { Types } from 'mongoose';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectDB();

    // Get user's current avatar information
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldFileId = user.avatarFileId; // Get the GridFS file ID

    // --- Database Update --- 
    // Clear avatar URL, file ID, and potentially the timestamp
    await User.findByIdAndUpdate(userId, { 
        $set: { 
            avatar: null, 
            avatarFileId: null,
            // Decide if removing avatar resets the timestamp. Resetting it allows immediate re-upload.
            avatarLastUpdatedAt: null 
        }
    });
    console.log(`[Avatar Remove] User ${userId} database record updated: avatar and avatarFileId cleared.`);
    // --- End DB Update --- 

    // --- Delete Old Avatar from GridFS --- 
    if (oldFileId) {
      const fileIdString = oldFileId.toString();
      try {
          if (await fileExists(fileIdString)) {
              await deleteFile(fileIdString);
              console.log(`[Avatar Remove] Successfully deleted avatar from GridFS: ${fileIdString}`);
          } else {
              console.warn(`[Avatar Remove] Avatar fileId ${fileIdString} not found in GridFS for deletion.`);
          }
      } catch (deleteError) {
          console.error(`[Avatar Remove] Failed to delete avatar ${fileIdString} from GridFS:`, deleteError);
          // Log error but consider the operation successful as the DB link is removed
      }
    } else {
        console.log(`[Avatar Remove] No avatarFileId found for user ${userId}, skipping GridFS deletion.`);
    }
    // --- End Deleting Old Avatar ---

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Avatar removal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove avatar' },
      { status: 500 }
    );
  }
} 