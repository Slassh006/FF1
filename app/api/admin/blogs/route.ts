import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '../../../lib/dbConnect';
import Blog from '../../../models/Blog';
import { uploadFile } from '../../../lib/gridfs';

// --- Helper Function for Unique Slug ---
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  let existingBlog = await Blog.findOne({ slug: slug }).lean(); // Use lean for performance

  while (existingBlog) {
    counter++;
    slug = `${baseSlug}-${counter}`;
    existingBlog = await Blog.findOne({ slug: slug }).lean();
  }
  return slug;
}
// --------------------------------------

// Define allowed categories based on schema
const ALLOWED_CATEGORIES = ['news', 'guide', 'event', 'update', 'community'];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10); // Default limit: 10
    const skip = (page - 1) * limit;

    // Build query object (can be extended later for filters)
    const query = {}; // Add filters here if needed, e.g., { status: 'published' }

    // Fetch total count for pagination
    const totalBlogs = await Blog.countDocuments(query);

    // Fetch paginated blogs
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name')
      .lean();

    return NextResponse.json({
      success: true,
      blogs,
      totalBlogs,
      currentPage: page,
      totalPages: Math.ceil(totalBlogs / limit),
    });

  } catch (error) {
    console.error('Error fetching blogs for admin:', error);
    return NextResponse.json({ success: false, error: 'Server error fetching blogs' }, { status: 500 });
  }
}

// POST (create blog)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await req.json();

    // --- Enhanced Validation ---
    if (!body.title || !body.content || !body.excerpt || !body.category) {
        return NextResponse.json({ success: false, message: 'Title, Content, Excerpt, and Category are required' }, { status: 400 });
    }
    if (!ALLOWED_CATEGORIES.includes(body.category)) {
       return NextResponse.json({ success: false, message: `Invalid category. Allowed categories are: ${ALLOWED_CATEGORIES.join(', ')}` }, { status: 400 });
    }
    // Add more validation here (e.g., lengths, tag formats) if needed

    // --- Assign Author ---
    body.author = session.user.id;

    // --- Generate Initial Slug (if not provided) ---
    let baseSlug = body.slug;
    if (!baseSlug) {
      baseSlug = body.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    // --- Ensure Unique Slug ---
    body.slug = await generateUniqueSlug(baseSlug);
    if (body.slug !== baseSlug) {
         console.log(`Original slug '${baseSlug}' was duplicate, generated new slug: ${body.slug}`);
    }
    // --- Set Published Status & Date ---
    if (body.status === 'published' && !body.publishedAt) {
      body.publishedAt = new Date();
    } else if (body.status === 'draft') {
      body.publishedAt = undefined;
    }
    // --- Create Blog ---
    const newBlog = await Blog.create(body);
    return NextResponse.json(
      { success: true, message: 'Blog created successfully', blog: newBlog },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Error creating blog for admin:', error);
    if (error instanceof mongoose.Error.ValidationError) {
       return NextResponse.json({ success: false, error: 'Validation Error', details: error.errors }, { status: 400 });
     }
    else if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        return NextResponse.json({ error: 'A blog post with this slug already exists.' }, { status: 409 });
    }
    let message = 'Server error creating blog post';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 