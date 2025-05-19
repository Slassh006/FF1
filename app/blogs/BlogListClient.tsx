'use client';

import React, { useState, ChangeEvent, useMemo } from 'react';
import { Blog as BlogType } from '../lib/types';
import Link from 'next/link';

interface BlogListClientProps {
  initialBlogs: BlogType[];
}

// Format date for display (can be a utility function)
const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    // Handle potential invalid date strings
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
      console.error("Error formatting date:", e);
      return 'Error Date';
  }
};

export default function BlogListClient({ initialBlogs }: BlogListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Derive all unique tags from the initially fetched blogs
  const allTags = useMemo(() => {
      const tags = new Set<string>();
      initialBlogs.forEach(blog => {
          (blog.tags || []).forEach(tag => tags.add(tag));
      });
      return Array.from(tags);
  }, [initialBlogs]);

  // Filter blogs based on current search term and selected tag
  const filteredBlogs = useMemo(() => {
      if (!initialBlogs) return [];
      return initialBlogs.filter((blog) => {
          const matchesSearch = searchTerm === '' ||
              blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (blog.excerpt && blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) || // Check excerpt too
              (blog.content && blog.content.toLowerCase().includes(searchTerm.toLowerCase())); // Check content
          
          const matchesTag = selectedTag === '' ||
              (blog.tags && blog.tags.includes(selectedTag));
          
          // Ensure blog is published (double-check, though should be pre-filtered)
          // const isPublished = blog.status === 'published';
          
          return matchesSearch && matchesTag; // && isPublished;
      });
  }, [initialBlogs, searchTerm, selectedTag]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTagChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTag(e.target.value);
  };

  return (
    <>
      {/* Search and filters */}
      <div className="bg-secondary rounded-lg p-4 mb-8 border border-primary/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search blogs..."
              className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex-shrink-0">
            <select 
              className="bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]" // Added min-width
              value={selectedTag}
              onChange={handleTagChange}
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Blog posts grid */}
      {filteredBlogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map(blog => (
            <div 
              key={blog._id} // Use _id from MongoDB
              className="bg-secondary rounded-lg overflow-hidden border border-primary/20 hover:border-primary/50 transition-all duration-300 flex flex-col" // Added flex flex-col
            >
              {/* Use featuredImage from the model */}
              {blog.featuredImage?.url && (
                <div className="h-48 w-full relative flex-shrink-0"> {/* Added flex-shrink-0 */} 
                  <img 
                    src={blog.featuredImage.url} 
                    alt={blog.featuredImage.alt || blog.title} // Use provided alt text or title
                    className="w-full h-full object-cover"
                    loading="lazy" // Added lazy loading
                  />
                  <div className="absolute bottom-0 left-0 bg-dark/70 px-3 py-1">
                    {/* Use publishedAt from the model */}
                    <p className="text-white/90 text-sm">{formatDate(blog.publishedAt)}</p>
                  </div>
                </div>
              )}
              
              <div className="p-4 flex flex-col flex-grow"> {/* Added flex flex-col flex-grow */} 
                <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">{blog.title}</h2>
                <p className="text-white/70 mb-4 line-clamp-3 flex-grow">{blog.excerpt}</p> {/* Added flex-grow */} 
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.tags?.map(tag => (
                    <span 
                      key={tag} 
                      className="bg-dark/50 text-white/80 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-auto"> {/* Pushes button to bottom */} 
                    <Link 
                      href={`/blogs/${blog.slug}`}
                      className="btn btn-primary btn-sm inline-block" // Adjusted styling
                    >
                      Read More
                    </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-secondary rounded-lg p-8 text-center border border-primary/20">
          <p className="text-white/50">
            No blog posts found matching your criteria.
          </p>
        </div>
      )}
    </>
  );
} 