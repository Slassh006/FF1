import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import { uploadFile, deleteFile, fileExists } from '@/app/lib/gridfs';
import { Types } from 'mongoose';

const MIN_UPDATE_INTERVAL_DAYS = 7;

export async function POST(req: NextRequest) {
  let oldFileIdToDelete: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    await connectDB();

    // --- Fetch User and Check Time Limit --- 
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.avatarLastUpdatedAt) {
      const lastUpdateDate = new Date(user.avatarLastUpdatedAt);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdateDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      if (daysDiff < MIN_UPDATE_INTERVAL_DAYS) {
        const daysRemaining = Math.ceil(MIN_UPDATE_INTERVAL_DAYS - daysDiff);
        return NextResponse.json({ 
            error: `You can change your avatar again in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.` 
        }, { status: 400 });
      }
    }
    // --- End Time Limit Check ---

    const formData = await req.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // --- Validations (Type and Size) --- 
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed' 
      }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 });
    }
    // --- End Validations ---

    // --- Prepare Old Avatar Deletion (GridFS) --- 
    if (user.avatarFileId) {
        oldFileIdToDelete = user.avatarFileId.toString();
        console.log(`[Avatar Upload] Old avatar fileId found: ${oldFileIdToDelete}`);
    } else {
        console.log('[Avatar Upload] No previous avatar fileId found.');
    }
    // --- End Preparing Deletion ---

    // --- Upload New Avatar to GridFS --- 
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.type.split('/')[1] || 'bin';
    const gridFsFilename = `avatar-${userId}-${Date.now()}.${fileExtension}`;

    const uploadResult = await uploadFile(buffer, gridFsFilename, file.type);
    if (!uploadResult || !uploadResult.fileId) {
        console.error('[Avatar Upload] GridFS upload failed to return fileId.');
        throw new Error('Failed to upload new avatar to storage.');
    }
    const newFileId = uploadResult.fileId;
    const newAvatarGridFsUrl = `/api/files/${newFileId}`;
    console.log(`[Avatar Upload] New avatar uploaded to GridFS: ${gridFsFilename} (ID: ${newFileId})`);
    // --- End Upload ---

    // --- Update User in Database (with new GridFS info) --- 
    user.avatar = newAvatarGridFsUrl;
    user.avatarFileId = new Types.ObjectId(newFileId);
    user.avatarLastUpdatedAt = new Date();
    await user.save();
    console.log(`[Avatar Upload] User ${userId} database record updated with new avatar URL and fileId.`);
    // --- End DB Update --- 

    // --- Delete Old Avatar from GridFS (Now that upload and DB update are successful) --- 
    if (oldFileIdToDelete) {
      try {
          if (await fileExists(oldFileIdToDelete)) {
              await deleteFile(oldFileIdToDelete);
              console.log(`[Avatar Upload] Successfully deleted old avatar from GridFS: ${oldFileIdToDelete}`);
          } else {
              console.warn(`[Avatar Upload] Old avatar fileId ${oldFileIdToDelete} not found in GridFS for deletion.`);
          }
      } catch (deleteError) {
          console.error(`[Avatar Upload] Failed to delete old avatar ${oldFileIdToDelete} from GridFS:`, deleteError);
      }
    }
    // --- End Deleting Old Avatar ---

    return NextResponse.json({ success: true, avatarUrl: newAvatarGridFsUrl });

  } catch (error: any) {
    console.error('Avatar upload error:', error);
    if (error instanceof Error && error.message.includes('Failed to upload file')) {
         return NextResponse.json({ error: 'Storage service failed to save the new avatar.', details: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: error.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
} 