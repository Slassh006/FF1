'use client';

import React from 'react';
import Section from '../ui/Section';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FaArrowRight } from 'react-icons/fa';

// Mock data for development
const FEATURED_BLOGS = [
  {
    id: '1',
    title: 'Free Fire MAX: Update 2023 - What\'s New',
    excerpt: 'Explore all the exciting new features and changes coming in the latest Free Fire MAX update.',
    coverImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    slug: 'free-fire-max-update-2023',
    date: '2023-10-15',
    tags: ['Update', 'Features'],
  },
  {
    id: '2',
    title: 'Top 10 Weapons for Ranked Matches',
    excerpt: 'Master these weapons to dominate your opponents and climb the ranked ladder quickly.',
    coverImage: 'https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
    slug: 'top-10-weapons-ranked-matches',
    date: '2023-10-10',
    tags: ['Weapons', 'Ranked'],
  },
  {
    id: '3',
    title: 'Best Character Combinations for 2023',
    excerpt: 'Find out which character combinations are dominating the meta this season.',
    coverImage: 'https://images.unsplash.com/photo-1519326776720-9e5c12f34318?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2034&q=80',
    slug: 'best-character-combinations-2023',
    date: '2023-10-05',
    tags: ['Characters', 'Meta'],
  },
];

const FeaturedBlogs = () => {
  return (
    <Section 
      title="Latest Blog Posts" 
      subtitle="Stay updated with the latest Free Fire news, tips, and strategies"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURED_BLOGS.map((blog) => (
          <Card
            key={blog.id}
            title={blog.title}
            description={blog.excerpt}
            imageUrl={blog.coverImage}
            href={`/blogs/${blog.slug}`}
            badges={blog.tags}
            footer={
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-white/60">{blog.date}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  href={`/blogs/${blog.slug}`}
                >
                  Read More
                </Button>
              </div>
            }
          />
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Button 
          variant="secondary" 
          href="/blogs"
          icon={<FaArrowRight />}
        >
          View All Blogs
        </Button>
      </div>
    </Section>
  );
};

export default FeaturedBlogs; 