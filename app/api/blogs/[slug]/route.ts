import connectDB from '@/app/lib/mongodb';
import Blog from '@/app/models/Blog';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

interface Params {
  params: {
    slug: string;
  };
}

// Get single blog by slug
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    
    const { slug } = params;
    
    // Find blog by slug
    const blog = await Blog.findOne({ slug, isPublished: true });
    
    if (!blog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      blog,
    });
  } catch (error: any) {
    console.error('Fetch Blog Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Update blog
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { slug } = params;
    const body = await request.json();
    
    // Find and update blog
    const updatedBlog = await Blog.findOneAndUpdate(
      { slug },
      { $set: body },
      { new: true, runValidators: true }
    );
    
    if (!updatedBlog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      blog: updatedBlog,
    });
  } catch (error: any) {
    console.error('Update Blog Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// Delete blog
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { slug } = params;
    
    // Find and delete blog
    const deletedBlog = await Blog.findOneAndDelete({ slug });
    
    if (!deletedBlog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete Blog Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
} 