import React from 'react';
import dbConnect from '../lib/dbConnect';
import Blog from '@/app/models/Blog'; // Assuming correct path
import BlogListClient from './BlogListClient'; // We'll move the client logic here
import { Blog as BlogType } from '../lib/types'; // Use existing type

// This function fetches data on the server
async function getPublishedBlogs() {
  try {
    await dbConnect();
    const blogs = await Blog.find({
      status: 'published' // Fetch only published blogs
    })
    .sort({ publishedAt: -1 }) // Sort by publication date
    .populate('author', 'name') // Optional: populate author name
    .lean(); // Use lean for plain JS objects

    // Ensure data is serializable (convert ObjectId, Date)
    return JSON.parse(JSON.stringify(blogs)) as BlogType[]; 
  } catch (error) {
    console.error("Failed to fetch published blogs:", error);
    return []; // Return empty array on error
  }
}

// Main page component (Server Component)
export default async function BlogsPage() {
  const initialBlogs = await getPublishedBlogs();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white font-orbitron mb-8 text-center">
        Free Fire Blog Posts
      </h1>
      
      {/* Pass initial data to the client component */}
      <BlogListClient initialBlogs={initialBlogs} />

    </div>
  );
} 