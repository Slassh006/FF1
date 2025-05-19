import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '../../../../lib/dbConnect';
import Blog from '../../../../models/Blog';
import mongoose from 'mongoose'; // Ensure mongoose is imported
import { deleteFile } from '../../../../lib/gridfs'; // <-- Import deleteFile

// --- Helper Function for Unique Slug (considering exclusion) ---
async function generateUniqueSlugForUpdate(baseSlug: string, excludeId: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  let existingBlog = await Blog.findOne({ slug: slug, _id: { $ne: excludeId } }).lean();

  while (existingBlog) {
    counter++;
    slug = `${baseSlug}-${counter}`;
    existingBlog = await Blog.findOne({ slug: slug, _id: { $ne: excludeId } }).lean();
  }
  return slug;
}
// -----------------------------------------------------------

// Define allowed categories (should ideally match schema/shared source)
const ALLOWED_CATEGORIES = ['news', 'guide', 'event', 'update', 'community'];

// GET single blog post by ID (for admin edit)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid blog ID format' }, { status: 400 });
    }

    const blog = await Blog.findById(id).lean();

    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, blog });

  } catch (error) {
    console.error(`Error fetching blog ${params.id} for admin:`, error);
    return NextResponse.json({ success: false, error: 'Server error fetching blog' }, { status: 500 });
  }
}

// PUT (update) blog post by ID - Updated logic
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const { id } = params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid blog ID format' }, { status: 400 });
    }

    const currentBlog = await Blog.findById(id, 'slug publishedAt').lean(); // Fetch publishedAt too
    if (!currentBlog) {
        return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    // --- Enhanced Validation ---
    // Check required fields if they are being modified (or ensure they aren't removed)
    // This basic check assumes frontend sends all required fields on update.
    // A more robust check might involve fetching the current doc and merging.
    if (!body.title || !body.content || !body.excerpt || !body.category) {
        return NextResponse.json({ success: false, message: 'Title, Content, Excerpt, and Category are required' }, { status: 400 });
    }
    // Validate category only if it's included in the update body
    if (body.category && !ALLOWED_CATEGORIES.includes(body.category)) {
       return NextResponse.json({ success: false, message: `Invalid category. Allowed categories are: ${ALLOWED_CATEGORIES.join(', ')}` }, { status: 400 });
    }
    // Add more validation (lengths, formats) here if needed

    // --- Ensure slug uniqueness ONLY if it's provided AND different from current ---
    if (body.slug && body.slug !== currentBlog.slug) {
        // Regenerate if needed, excluding the current document ID
        const baseSlug = body.slug;
        body.slug = await generateUniqueSlugForUpdate(baseSlug, id);
         if (body.slug !== baseSlug) {
             console.log(`Original slug '${baseSlug}' caused conflict during update, generated new slug: ${body.slug}`);
             // Optional: Send a warning back to the client? Or just proceed.
        }
    } else if (!body.slug) {
        // If slug wasn't provided in update, keep the existing one
        body.slug = currentBlog.slug;
    }
    // If body.slug === currentBlog.slug, no check needed

    // --- Handle Published Status & Date ---
    if (body.status === 'published') {
      if (!body.publishedAt && !currentBlog.publishedAt) { // Only set if currently not set
         body.publishedAt = new Date();
      }
      // Keep existing publishedAt if it exists and status remains published, unless explicitly overridden in body
    } else if (body.status === 'draft' || body.status === 'archived') {
      body.publishedAt = undefined; // Use undefined to unset
    }

    // --- Update Blog ---
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    // Note: findByIdAndUpdate doesn't return the document if it wasn't found with the ID
    // So the previous check for currentBlog handles the 404 case implicitly here.

    return NextResponse.json({ success: true, blog: updatedBlog });

  } catch (error: any) {
    console.error(`Error updating blog ${params.id} for admin:`, error);
    if (error.name === 'ValidationError') {
       return NextResponse.json({ success: false, error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Server error updating blog' }, { status: 500 });
  }
}

// DELETE blog post by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid blog ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    
    // 1. Find the blog post to get its featured image fileId
    const blogToDelete = await Blog.findById(id).select('featuredImage.fileId featuredImage.url'); // Select fileId and url

    if (!blogToDelete) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    // 2. Attempt to delete the featured image from GridFS if fileId exists
    let fileDeleted = false;
    const fileId = blogToDelete.featuredImage?.fileId?.toString(); 
    // Fallback: Try extracting from URL if fileId is missing (for older posts)
    let fileIdFromUrl: string | null = null;
    if (!fileId && blogToDelete.featuredImage?.url?.includes('/api/files/')) {
        try {
            const urlParts = blogToDelete.featuredImage.url.split('/');
            const potentialId = urlParts[urlParts.length - 1];
            if (mongoose.Types.ObjectId.isValid(potentialId)) {
                fileIdFromUrl = potentialId;
            }
        } catch (e) { console.warn('Could not parse fileId from blog featuredImage URL'); }
    }
    
    const effectiveFileId = fileId || fileIdFromUrl;

    if (effectiveFileId) {
        try {
            console.log(`[Blog Delete] Attempting to delete featured image GridFS file: ${effectiveFileId}`);
            await deleteFile(effectiveFileId);
            fileDeleted = true;
            console.log(`[Blog Delete] Successfully deleted featured image GridFS file: ${effectiveFileId}`);
        } catch (fileErr) {
            console.error(`[Blog Delete] Failed to delete featured image GridFS file ${effectiveFileId}:`, fileErr);
            // Log error but continue deleting the blog post itself
        }
    }

    // 3. Delete the blog post document
    await Blog.findByIdAndDelete(id);
    console.log(`[Blog Delete] Deleted Blog document ${id}`);

    return NextResponse.json({ 
        success: true, 
        message: 'Blog deleted successfully',
        details: { fileId: effectiveFileId, fileDeleted }
     });

  } catch (error) {
    console.error(`Error deleting blog ${params.id} for admin:`, error);
    return NextResponse.json({ success: false, error: 'Server error deleting blog' }, { status: 500 });
  }
} 