import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { UploadResult } from '@/app/types/upload';
import FileUpload from '@/app/components/common/FileUpload';

interface WallpaperFormData {
  title: string;
  description: string;
  category: string;
  tags: string;
  isPublished: boolean;
  isHD: boolean;
  isNew: boolean;
  isTrending: boolean;
}

const initialFormData: WallpaperFormData = {
  title: '',
  description: '',
  category: 'Free Fire',
  tags: '',
  isPublished: true,
  isHD: false,
  isNew: true,
  isTrending: false
};

export default function WallpaperUploadFormNew() {
  const router = useRouter();
  const [formData, setFormData] = useState<WallpaperFormData>(initialFormData);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadResult) {
      toast.error('Please upload a wallpaper image');
      return;
    }

    try {
      const response = await fetch('/api/admin/wallpapers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          metadata: uploadResult.metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create wallpaper');
      }

      toast.success('Wallpaper created successfully');
      router.refresh();
      router.push('/admin/wallpapers');
    } catch (error) {
      console.error('Error creating wallpaper:', error);
      toast.error('Failed to create wallpaper');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="bg-secondary rounded-lg p-6 border border-primary/20">
        <h2 className="text-xl font-bold text-white mb-6">Add New Wallpaper</h2>

        {/* File Upload */}
        <div className="mb-6">
          <FileUpload
            fileType="wallpaper"
            onUploadComplete={handleUploadComplete}
            label="Wallpaper Image"
            required
            accept="image/*"
            placeholder="Drag & drop a wallpaper image or click to browse"
          />
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 rounded-lg bg-dark border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-dark border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 rounded-lg bg-dark border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Free Fire">Free Fire</option>
            <option value="Gaming">Gaming</option>
            <option value="Anime">Anime</option>
            <option value="Nature">Nature</option>
            <option value="Abstract">Abstract</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="Comma-separated tags"
            className="w-full px-4 py-2 rounded-lg bg-dark border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleInputChange}
              className="h-5 w-5 rounded bg-dark border-gray-600 text-primary focus:ring-primary"
            />
            <span className="text-gray-300">Published</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isHD"
              checked={formData.isHD}
              onChange={handleInputChange}
              className="h-5 w-5 rounded bg-dark border-gray-600 text-primary focus:ring-primary"
            />
            <span className="text-gray-300">HD Quality</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isNew"
              checked={formData.isNew}
              onChange={handleInputChange}
              className="h-5 w-5 rounded bg-dark border-gray-600 text-primary focus:ring-primary"
            />
            <span className="text-gray-300">New</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isTrending"
              checked={formData.isTrending}
              onChange={handleInputChange}
              className="h-5 w-5 rounded bg-dark border-gray-600 text-primary focus:ring-primary"
            />
            <span className="text-gray-300">Trending</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Create Wallpaper
        </button>
      </div>
    </form>
  );
} 