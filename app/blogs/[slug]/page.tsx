import React from 'react';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import Blog from '@/app/models/Blog';
import { Metadata, ResolvingMetadata } from 'next';
import NextImage from 'next/image';
import Link from 'next/link';
import * as cheerio from 'cheerio'; // Import cheerio
import TiptapEditor from '@/app/components/TiptapEditor';

// Simple inline slugify function (replace with a robust library if needed)
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^Ѐ-ӿ\w\-]+/g, '') // Remove all non-word chars (including non-Cyrillic/Latin)
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Define structure for Table of Contents items
interface TocItem {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

// Define the expected structure of the fetched blog data
// Adapt this based on your actual Blog model if needed
interface BlogData {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: {
    url: string;
    alt?: string;
    caption?: string;
  };
  author: {
    _id: string;
    name?: string; // Assuming name is populated
    // Add other populated author fields if necessary
  };
  category: string;
  tags?: string[];
  status: string;
  publishedAt?: string | Date; // Date should be string after serialization
  createdAt: string | Date;
  updatedAt: string | Date;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };
  // Add other fields you need to display
}

// Function to fetch a single published blog by slug
async function getBlogBySlug(slug: string): Promise<BlogData | null> {
  try {
    await dbConnect();
    const blog = await Blog.findOne({ 
        slug: slug, 
        status: 'published' // Ensure it's published
    })
    .populate('author', 'name') // Populate author fields you need
    .lean();

    if (!blog) {
      return null; // Indicate not found
    }

    // Convert ObjectId and Date to strings for serialization
    return JSON.parse(JSON.stringify(blog)) as BlogData;

  } catch (error) {
    console.error(`Failed to fetch blog with slug ${slug}:`, error);
    // In case of error during fetch, treat as not found or handle differently
    return null; 
  }
}

// --- Updated Function to fetch AND process blog content ---
async function getProcessedBlogBySlug(slug: string): Promise<{ blog: BlogData; processedContent: string; headings: TocItem[] } | null> {
  try {
    await dbConnect();
    const blog = await Blog.findOne({ 
        slug: slug, 
        status: 'published'
    })
    .populate('author', 'name')
    .lean();

    if (!blog || !blog.content) {
      return null;
    }

    const $ = cheerio.load(blog.content);
    const headings: TocItem[] = [];
    const headingTags = 'h2, h3';
    const generatedIds = new Set<string>(); // Keep track of generated IDs to ensure uniqueness

    $(headingTags).each((index, element) => {
      // Check if it's a tag element before accessing tagName
      if (element.type === 'tag') {
        const el = element as cheerio.TagElement; // Now we know it's a TagElement
        const $element = $(el);
        const text = $element.text();
        const level = parseInt(el.tagName.substring(1), 10);

        let id = $element.attr('id');
        if (!id) {
            let potentialId = slugify(text);
            let counter = 1;
            while (generatedIds.has(potentialId)) { 
                potentialId = `${slugify(text)}-${counter}`;
                counter++;
            }
            id = potentialId;
            $element.attr('id', id);
            generatedIds.add(id);
        }
        
        // Only add if ID is valid (should always be at this point)
        if (id) {
           headings.push({ id, text, level });
        }
      }
    });

    const processedContent = $.html();
    const serializableBlog = JSON.parse(JSON.stringify(blog)) as BlogData;

    return { blog: serializableBlog, processedContent, headings };

  } catch (error) {
    console.error(`Failed to fetch/process blog with slug ${slug}:`, error);
    return null; 
  }
}

// --- Metadata Generation --- 
type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;
  const data = await getProcessedBlogBySlug(slug); // Use the processing function

  if (!data?.blog) {
    return {
      title: 'Blog Post Not Found',
    };
  }
  const blog = data.blog;

  const previousImages = (await parent).openGraph?.images || [];
  const ogImage = blog.seo?.ogImage || blog.featuredImage?.url || '';

  return {
    title: blog.seo?.metaTitle || blog.title,
    description: blog.seo?.metaDescription || blog.excerpt,
    keywords: blog.seo?.keywords || blog.tags || [],
    openGraph: {
      title: blog.seo?.metaTitle || blog.title,
      description: blog.seo?.metaDescription || blog.excerpt,
      url: `/blogs/${blog.slug}`,
      images: ogImage ? [ogImage, ...previousImages] : previousImages,
      type: 'article',
      publishedTime: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
      authors: blog.author?.name ? [blog.author.name] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.seo?.metaTitle || blog.title,
      description: blog.seo?.metaDescription || blog.excerpt,
      images: ogImage ? [ogImage] : [],
    },
  };
}
// -------------------------

// Format date utility (can be moved to a shared file)
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', // Use long month name
      day: 'numeric',
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Error Date';
  }
};

// Simple function to estimate read time
const calculateReadTime = (text: string): number => {
    if (!text) return 0;
    // Remove HTML tags for a more accurate word count
    const plainText = text.replace(/<[^>]*>/g, ' ');
    const words = plainText.trim().split(/\s+/).length;
    const wordsPerMinute = 200; // Average reading speed
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
};

// --- Import Sidebar Component --- 
// Assuming it will be created at this path
import TocSidebar from '@/app/components/TocSidebar'; 

// Main Page Component (Server Component)
export default async function BlogPostPage({ params }: Props) {
  const processedData = await getProcessedBlogBySlug(params.slug);

  if (!processedData) {
    notFound();
  }

  const { blog, processedContent, headings } = processedData;
  const readTime = calculateReadTime(blog.content);

  return (
    <article className="pb-12 md:pb-16"> 
      
      {/* Combined Header and Featured Image Section */}
      <div className="relative bg-dark text-white"> {/* Container for image and overlay */} 
        {/* Featured Image */} 
        {blog.featuredImage?.url && (
          <div className="w-full max-h-[60vh] overflow-hidden"> {/* Limit image height */} 
            <NextImage
              src={blog.featuredImage.url}
              alt={blog.title} // Use title for main image alt
              width={1920} // Provide large base width
              height={1080} // Provide large base height (16:9)
              sizes="100vw"
              style={{ width: '100%', height: 'auto', objectFit: 'cover', maxHeight: '60vh' }} // Cover, maintain aspect, limit height
              priority
            />
          </div>
        )}

        {/* Overlay for Header Text */} 
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 md:p-10 lg:p-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Date */} 
            <time
              dateTime={blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined}
              className="block text-base font-medium text-primary uppercase tracking-wider mb-2 md:mb-3"
            >
              {formatDate(blog.publishedAt)}
            </time>
            {/* Title */} 
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-orbitron leading-tight break-words">
              {blog.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Excerpt Section */}
      {blog.excerpt && (
        <div className="container mx-auto px-4 mt-8 md:mt-10">
          <p className="text-lg md:text-xl text-center font-light text-white/80 italic max-w-3xl mx-auto">
            {blog.excerpt}
          </p>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="container mx-auto px-4 mt-10 md:mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Main Content Area */}
              <div className="lg:col-span-3">
                 <div 
                    // Use processedContent with IDs. Removed max-w, mx-auto, px-4 as grid handles layout
                    className="prose dark:prose-invert prose-lg 
                               prose-headings:font-orbitron prose-headings:text-white prose-headings:scroll-mt-20
                               prose-a:text-primary hover:prose-a:text-primary/80 
                               prose-strong:text-white/90 
                               prose-blockquote:border-primary prose-blockquote:text-white/80 
                               prose-code:text-primary/90 prose-code:bg-dark/50 prose-code:p-1 prose-code:rounded-sm 
                               prose-pre:bg-dark/80 prose-pre:text-white/80" // Added scroll-mt for heading links
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                  />
              </div>

              {/* Sidebar Area - Sticky */}
              <aside className="lg:col-span-1 hidden lg:block"> {/* Hide on small screens */} 
                 <div className="sticky top-24"> {/* Adjust top offset as needed */} 
                     <TocSidebar headings={headings} />
                 </div>
              </aside>
          </div>
      </div>

      {/* Metadata Footer - Only render if category or tags exist */}
      {(blog.category || (blog.tags && blog.tags.length > 0)) && (
        <footer className="max-w-3xl mx-auto px-4 mt-12 pt-8 border-t border-gray-700/50 text-sm text-white/60">
            <div className="flex flex-col sm:flex-row justify-between gap-y-4 gap-x-6">
                {/* Category Section (if exists) */} 
                {blog.category ? ( 
                    <div> 
                       <p>Category: 
                           <Link 
                              href={`/blogs?category=${encodeURIComponent(blog.category)}`} 
                              className="font-medium text-white/80 hover:text-primary transition-colors duration-200 ml-1 underline underline-offset-2"
                            >
                              {blog.category}
                           </Link>
                       </p>
                    </div>
                ) : <div />} {/* Empty div to maintain justify-between spacing if no category */} 

                {/* Tags Section (if exists) */} 
                {blog.tags && blog.tags.length > 0 && (
                   <div> {/* Removed sm:text-right, parent handles alignment */} 
                      <p className="mb-2 font-medium text-white/80 sm:text-right">Tags:</p> {/* Keep label right-aligned on larger screens */} 
                      <div className="flex flex-wrap sm:justify-end gap-2">
                          {blog.tags.map(tag => (
                               <Link 
                                  href={`/blogs?tag=${encodeURIComponent(tag)}`} 
                                  key={tag} 
                                  className="bg-dark/60 text-white/80 text-xs px-2.5 py-1 rounded-full hover:bg-primary hover:text-dark transition-colors duration-200"
                                >
                                  #{tag}
                               </Link>
                          ))}
                      </div>
                   </div>
                )}
            </div>
        </footer>
      )}

    </article>
  );
} 