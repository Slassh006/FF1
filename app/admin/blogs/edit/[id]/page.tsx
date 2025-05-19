import React from 'react';
import { notFound } from 'next/navigation';
import BlogFormStepper from '@/app/admin/blogs/components/BlogFormStepper';
import { Blog } from '@/app/lib/types';
import { ALLOWED_CATEGORIES } from '@/app/lib/constants';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

// Helper function to fetch blog data (can be moved to a lib/api file later)
async function getBlogById(id: string): Promise<Blog | null> {
  try {
    // Ensure the fetch uses absolute URL on the server-side
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000'}/api/admin/blogs/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Add any necessary auth headers if required
        },
        cache: 'no-store', // Don't cache admin data
    });

    if (!res.ok) {
      // Log error details if needed
      console.error(`Failed to fetch blog ${id}: ${res.status} ${res.statusText}`);
      // Consider throwing an error or returning null based on how you want to handle it
      if (res.status === 404) {
        return null; // Explicitly return null for not found
      }
      throw new Error('Failed to fetch blog data');
    }

    const data = await res.json();
    return data.blog as Blog; // Adjust based on your API response structure
  } catch (error) {
    console.error('Error fetching blog by ID:', error);
    return null; // Return null on error
  }
}

interface EditBlogPageProps {
  params: {
    id: string;
  };
}

const EditBlogPage: React.FC<EditBlogPageProps> = async ({ params }) => {
  const { id } = params;
  const blogData = await getBlogById(id);

  if (!blogData) {
    notFound(); // Trigger 404 page if blog not found
  }

  // We need to ensure the _id is passed correctly.
  // The Blog type might already include _id, but let's ensure it's passed explicitly
  // if the BlogFormStepper expects it directly in initialData.
  // Assuming BlogFormStepper's initialData prop now correctly handles the Blog type
  // after the previous refactor.

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin/blogs" className="text-white/70 hover:text-primary inline-flex items-center">
          <FaArrowLeft className="mr-2" />
          Back to Blog List
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">Edit Blog Post</h1>
      {/* Pass the fetched blog data to the stepper */}
      <BlogFormStepper initialData={blogData} />
    </div>
  );
};

export default EditBlogPage; 