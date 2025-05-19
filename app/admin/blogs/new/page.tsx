'use client';

import React from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import BlogFormStepper from '../components/BlogFormStepper'; // Corrected import path

const NewBlogPage = () => {
  return (
    <div className="px-6 py-8">
      <div className="flex items-center mb-8">
        <Link href="/admin/blogs" className="mr-4 text-white/70 hover:text-white">
          <FaArrowLeft />
        </Link>
        <h1 className="text-2xl font-bold text-white font-orbitron">Create New Blog Post</h1>
      </div>

      <BlogFormStepper /> 
      
    </div>
  );
};

export default NewBlogPage; 