'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaEye, FaFilter, FaChevronLeft, FaChevronRight, FaSortAmountDown, FaSortAmountUp, FaInfoCircle, FaExternalLinkAlt, FaUser, FaCalendarAlt } from 'react-icons/fa';
// import { blogs as mockBlogs } from '@/lib/mockData'; // Remove mock data
import { Blog as BlogType } from '../../lib/types';
import { formatDate } from '../../lib/formatDate';

const AdminBlogsPage = () => {
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalBlogs, setTotalBlogs] = useState<number>(0);
  const blogsPerPage = 10; // Or fetch from API response if limit is variable

  // Fetch blogs from API
  const fetchBlogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/blogs?page=${page}&limit=${blogsPerPage}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch blogs');
      }
      const data = await response.json();
      if (data.success) {
        setBlogs(data.blogs || []);
        setTotalBlogs(data.totalBlogs || 0);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error || 'API returned success=false');
      }
    } catch (err: any) {
      console.error("Fetch blogs error:", err);
      setError(err.message || 'An error occurred while fetching blogs.');
      setBlogs([]); // Clear blogs on error
      setTotalBlogs(0);
      setCurrentPage(1);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [blogsPerPage]);

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [fetchBlogs, currentPage]);

  // Get all unique tags from fetched blogs
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogs.forEach(blog => {
        (blog.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [blogs]);

  // Filter blogs based on client-side state
  const filteredBlogs = useMemo(() => {
      return blogs.filter(blog => {
          const matchesSearch = searchTerm === '' ||
              blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (blog.excerpt && blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())); // Search title/excerpt
          
          const matchesStatus = selectedStatus === 'all' || blog.status === selectedStatus;
          
          const matchesTags = selectedTags.length === 0 || 
              selectedTags.every(tag => blog.tags?.includes(tag)); // Blog must have ALL selected tags
          
          return matchesSearch && matchesStatus && matchesTags;
      });
  }, [blogs, searchTerm, selectedStatus, selectedTags]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Format date for display
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
       return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'Error Date';
    }
  };

  // Delete Blog Handler
  const handleDelete = async (id: string, title: string) => {
     if (window.confirm(`Are you sure you want to delete the blog post "${title}"? This action cannot be undone.`)) {
        const toastId = toast.loading('Deleting blog...');
        try {
             const response = await fetch(`/api/admin/blogs/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete blog');
            }
            toast.success('Blog deleted successfully!', { id: toastId });
            // Refetch blogs after deletion
            fetchBlogs(currentPage); 
        } catch (error: any) {
             console.error("Delete error:", error);
             toast.error(error.message || 'Failed to delete blog.', { id: toastId });
        }
     }
  };

  // --- Tag Input Handlers --- 
  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag]);
        setTagInput('');
    }
  };
  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };
  // ------------------------

  // --- Pagination Handlers ---
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        // fetchBlogs will be triggered by the useEffect watching currentPage
    }
  };
  // -------------------------

  const handleBulkDelete = async () => {
    if (selectedBlogs.length === 0) {
      toast.error('Please select blogs to delete.');
      return;
    }
    const toastId = toast.loading(`Deleting ${selectedBlogs.length} blog(s)...`);
    try {
      // Replace with your actual bulk delete API endpoint
      const response = await fetch('/api/admin/blogs/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedBlogs }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete blogs');
      }
      toast.success('Blogs deleted successfully', { id: toastId });
      setSelectedBlogs([]); // Clear selection
      fetchBlogs(currentPage, searchTerm, sortConfig); // Refresh list
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  // Handle single blog deletion
  const handleDeleteBlog = async (blogId: string) => {
    // ... existing code ...
  };

  return (
    <div className="px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white font-orbitron">Blog Posts</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary btn-sm">
            <FaFilter className="mr-1"/> {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <Link 
            href="/admin/blogs/new" 
            className="btn btn-primary btn-sm flex items-center" // Use DaisyUI btn classes
          >
            <FaPlus className="mr-2" /> New Blog Post
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      {showFilters && (
        <div className="bg-secondary rounded-lg p-4 mb-6 border border-primary/20">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-grow w-full md:w-auto">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="Search title or excerpt..."
                className="w-full bg-dark text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" // Made smaller
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Status Filter */}
            <div className="flex-shrink-0 w-full md:w-auto">
              <select 
                className="w-full md:w-auto bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" // Made smaller
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)} // Update status state
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Tags filter */}
          {allTags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark">
                <p className="text-white/70 text-sm mb-2">Filter by tags (AND):</p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors duration-150 ${
                        selectedTags.includes(tag) 
                          ? 'bg-primary text-dark font-medium' 
                          : 'bg-dark/50 text-white/70 hover:bg-dark'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
          )}
        </div>
      )}

      {/* Loading and Error States */}
      {isLoading && <p className="text-center text-white/70 py-8">Loading blogs...</p>}
      {error && <p className="text-center text-red-500 py-8">Error: {error}</p>}

      {/* Blog posts table */}
      {!isLoading && !error && (
          <div className="bg-secondary rounded-lg border border-primary/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-white/90 text-sm">
                <thead className="bg-dark/50 text-white/70 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Date Published</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark/30">
                  {filteredBlogs.length > 0 ? (
                    filteredBlogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-dark/20 transition-colors duration-150">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-base">{blog.title}</span>
                            <span className="text-white/50 text-xs mt-1">/{blog.slug}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                           {/* Display publishedAt if published, else createdAt */}
                           {formatDate(blog.status === 'published' ? blog.publishedAt : blog.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {/* Use status field */} 
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            blog.status === 'published' ? 'bg-green-100/10 text-green-400' :
                            blog.status === 'draft' ? 'bg-yellow-100/10 text-yellow-400' :
                            'bg-gray-100/10 text-gray-400' // Archived or other
                          }`}>
                            {blog.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <Link 
                                href={`/blogs/${blog.slug}`} 
                                target="_blank"
                                className="text-white/70 hover:text-cyan-400 p-1 tooltip tooltip-left"
                                data-tip="View Live"
                             >
                                <FaEye size={16}/>
                             </Link>
                            <Link 
                              href={`/admin/blogs/edit/${blog._id}`} 
                              className="text-white/70 hover:text-primary p-1 tooltip tooltip-left"
                              data-tip="Edit"
                             >
                              <FaEdit size={16}/>
                            </Link>
                            <button 
                              onClick={() => handleDelete(blog._id, blog.title)}
                              className="text-white/70 hover:text-red-500 p-1 tooltip tooltip-left"
                              data-tip="Delete"
                            >
                              <FaTrash size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                        No blog posts found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {/* Pagination Controls */} 
      {!isLoading && !error && totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center space-x-2">
              <button 
                 onClick={() => handlePageChange(currentPage - 1)} 
                 disabled={currentPage === 1}
                 className="btn btn-sm btn-secondary disabled:opacity-50"
               >
                 <FaChevronLeft />
                 Previous
              </button>
              <span className="text-sm text-white/80">
                 Page {currentPage} of {totalPages} (Total: {totalBlogs} posts)
              </span>
               <button 
                 onClick={() => handlePageChange(currentPage + 1)} 
                 disabled={currentPage === totalPages}
                 className="btn btn-sm btn-secondary disabled:opacity-50"
               >
                 Next
                 <FaChevronRight />
              </button>
          </div>
      )}
    </div>
  );
};

export default AdminBlogsPage; 