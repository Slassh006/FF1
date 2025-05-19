import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/app/lib/db';
import CraftlandCode from '@/app/models/CraftlandCode';
import mongoose from 'mongoose';
import { uploadFile, deleteFile } from '@/app/utils/fileUpload';
import { ApiError } from '@/app/lib/api';

// Constants (Consider moving to a shared file)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// GET /api/admin/craftland-codes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const craftlandCodes = await CraftlandCode.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, craftlandCodes });
  } catch (error: any) {
    console.error('Error fetching craftland codes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch craftland codes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/craftland-codes (Admin Creation Endpoint)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    
    // Handle cover image upload
    let coverImageUrl = '';
    const coverImageFile = formData.get('coverImage') as File;
    if (coverImageFile) {
      const uploadedFile = await uploadFile(coverImageFile, 'craftland-codes');
      coverImageUrl = uploadedFile.url;
    }

    // Create new code
    const newCode = await CraftlandCode.create({
      code: formData.get('code'),
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      region: formData.get('region'),
      difficulty: formData.get('difficulty'),
      status: formData.get('status'),
      isVerified: formData.get('isVerified') === 'true',
      author: formData.get('author'),
      videoUrl: formData.get('videoUrl'),
      isActive: formData.get('isActive') === 'true',
      coverImage: coverImageUrl,
      features: formData.getAll('features[]'),
      submittedBy: session.user.id,
    });

    return NextResponse.json({ craftlandCode: newCode });
  } catch (error: any) {
    console.error('Error creating craftland code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create craftland code' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/craftland-codes (Admin Update Endpoint)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const id = formData.get('id') as string;
    const oldCoverImage = formData.get('oldCoverImage') as string;

    // Get the existing code
    const existingCode = await CraftlandCode.findById(id);
    if (!existingCode) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    // Handle cover image upload if provided
    let coverImageUrl = existingCode.coverImage;
    const coverImageFile = formData.get('coverImage') as File;
    if (coverImageFile) {
      // Delete old cover image if it exists
      if (oldCoverImage) {
        try {
          const oldImagePath = oldCoverImage.split('/').pop();
          if (oldImagePath) {
            await deleteFile(oldImagePath);
          }
        } catch (error) {
          console.error('Error deleting old cover image:', error);
          // Continue with the update even if deletion fails
        }
      }

      // Upload new cover image
      const uploadedFile = await uploadFile(coverImageFile, 'craftland-codes');
      coverImageUrl = uploadedFile.url;
    }

    // Update the code
    const updatedCode = await CraftlandCode.findByIdAndUpdate(
      id,
      {
        code: formData.get('code'),
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        region: formData.get('region'),
        difficulty: formData.get('difficulty'),
        status: formData.get('status'),
        isVerified: formData.get('isVerified') === 'true',
        author: formData.get('author'),
        videoUrl: formData.get('videoUrl'),
        isActive: formData.get('isActive') === 'true',
        coverImage: coverImageUrl,
        features: formData.getAll('features[]'),
      },
      { new: true }
    );

    return NextResponse.json({ craftlandCode: updatedCode });
  } catch (error: any) {
    console.error('Error updating craftland code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update craftland code' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get the code to delete its cover image
    const code = await CraftlandCode.findById(id);
    if (!code) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    // Delete cover image if exists
    if (code.coverImage) {
      try {
        const imagePath = code.coverImage.split('/').pop();
        if (imagePath) {
          await deleteFile(imagePath);
        }
      } catch (error) {
        console.error('Error deleting cover image:', error);
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete the code
    await CraftlandCode.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Code deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting craftland code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete craftland code' },
      { status: 500 }
    );
  }
} 