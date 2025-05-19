import connectDB from '@/app/lib/mongodb';
import Blog from '@/app/models/Blog';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { slugify } from '@/app/lib/utils';
import { verifyToken } from '@/app/lib/auth';

// Get blogs (public)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = { isPublished: true };
    
    if (tag) {
      query.tags = tag;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }
    
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Blog.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      blogs,
      pagination: {
        page,
        perPage: limit,
        totalBlogs: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create blog (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { success: false, message: 'Title and content are required' },
        { status: 400 }
      );
    }
    
    // Generate slug if not provided
    if (!body.slug) {
      body.slug = body.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug: body.slug });
    
    if (existingBlog) {
      // Append timestamp to make slug unique
      body.slug = `${body.slug}-${Date.now()}`;
    }
    
    // Create blog
    const newBlog = await Blog.create(body);
    
    return NextResponse.json({
      success: true,
      message: 'Blog created successfully',
      blog: newBlog,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update blog (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token
    const { verified, payload } = await verifyToken(token);
    
    if (!verified || !payload || !payload.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Parse request body
    const body = await request.json();
    
    // Validate ID
    if (!body._id) {
      return NextResponse.json(
        { success: false, message: 'Blog ID is required' },
        { status: 400 }
      );
    }
    
    // Check if slug exists and is different from current blog
    if (body.slug) {
      const existingBlog = await Blog.findOne({ 
        slug: body.slug,
        _id: { $ne: body._id }
      });
      
      if (existingBlog) {
        // Append timestamp to make slug unique
        body.slug = `${body.slug}-${Date.now()}`;
      }
    }
    
    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      body._id,
      body,
      { new: true }
    );
    
    if (!updatedBlog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Blog updated successfully',
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

// Delete blog (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify token
    const { verified, payload } = await verifyToken(token);
    
    if (!verified || !payload || !payload.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Get ID from query parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Blog ID is required' },
        { status: 400 }
      );
    }
    
    // Delete blog
    const deletedBlog = await Blog.findByIdAndDelete(id);
    
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