'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FaTimes, FaCheck, FaFire, FaImage, FaTags, FaCog, FaSave, FaUpload } from 'react-icons/fa';
import type { Wallpaper, MediaAsset } from '@/types/wallpaper';

interface Props {
  wallpaper: Wallpaper;
  onClose: () => void;
  onSuccess: (updatedWallpaper: Wallpaper) => void;
}

interface FormData {
  title: string;
  description: string;
  category: Wallpaper['category'];
  tags: string;
  isPublished: boolean;
  isHD: boolean;
  isNew: boolean;
  isTrending: boolean;
  originalImageUrl: string;
  resolution?: string;
}

export default function WallpaperEditForm({ wallpaper, onClose, onSuccess }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: wallpaper.title || '',
    description: wallpaper.description || '',
    category: wallpaper.category || 'Free Fire',
    tags: Array.isArray(wallpaper.tags) ? wallpaper.tags.join(', ') : '',
    isPublished: wallpaper.isPublished || false,
    isHD: wallpaper.isHD || false,
    isNew: wallpaper.isNew || false,
    isTrending: wallpaper.isTrending || false,
    originalImageUrl: wallpaper.originalImageUrl || '',
    resolution: wallpaper.resolution || '',
  });

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  // Define shared input classes for consistency
  const inputBaseClass = "block w-full rounded-lg border bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-2";
  const inputBorderClass = "border-gray-700 focus:border-primary focus:ring-primary";
  const inputPaddingClass = "px-4 py-2";
  const inputClass = `${inputBaseClass} ${inputBorderClass} ${inputPaddingClass}`;
  const checkboxClass = "h-5 w-5 rounded bg-dark border-gray-600 text-primary focus:ring-primary focus:ring-offset-secondary";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error state
    setImageError(false);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      setImageError(true);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      setImageError(true);
      return;
    }

    // Create preview URL
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setNewImagePreview(previewUrl);
    setNewImage(file);
  };

  const handleRemoveNewImage = () => {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImage(null);
    setNewImagePreview(null);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'tags') {
          const tagsArray = (value as string).split(',')
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0);
          formDataToSend.append('tags', JSON.stringify(tagsArray));
        } else {
          formDataToSend.append(key, String(value));
        }
      });

      // Append new image if exists
      if (newImage) {
        formDataToSend.append('newImage', newImage);
      }

      const response = await fetch(`/api/admin/wallpapers/${wallpaper._id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/admin/login');
          throw new Error('Session expired. Please log in again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to update wallpaper');
      }

      toast.success('Wallpaper updated successfully');
      router.refresh();
      router.push('/admin/wallpapers'); // Redirect to wallpapers list after successful update
      onSuccess(wallpaper);
    } catch (error) {
      console.error('Error updating wallpaper:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update wallpaper');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageUrl = () => {
    if (newImagePreview) {
      return newImagePreview;
    }
    if (wallpaper?.mediaAssetId?.gridfs_id_original) {
      return `/api/media/${wallpaper.mediaAssetId.gridfs_id_original}?type=image`;
    }
    if (wallpaper?.mediaAssetId?.gridfs_id_edited) {
      return `/api/media/${wallpaper.mediaAssetId.gridfs_id_edited}?type=image`;
    }
    if (wallpaper?.imageUrl) {
      return wallpaper.imageUrl;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
      {/* Preview Section */}
      <div className="lg:col-span-1 bg-secondary rounded-lg p-4 border border-primary/20 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center font-orbitron">
          <FaImage className="mr-2 text-primary" />
          Preview
        </h3>
        <div className="relative aspect-video rounded-lg overflow-hidden border border-primary/10 shadow-lg bg-black/20">
          {getImageUrl() ? (
            <>
              <Image
                src={getImageUrl()!}
                alt={wallpaper.title || 'Wallpaper preview'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                onError={() => setImageError(true)}
              />
              {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark/50">
                  <div className="text-center">
                    <FaImage className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Failed to load image</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark/50">
              <div className="text-center">
                <FaImage className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No image available</p>
              </div>
            </div>
          )}
          {wallpaper.isHD && (
            <span className="absolute top-2 left-2 bg-primary text-dark text-xs px-2 py-1 rounded font-bold font-orbitron">
              HD
            </span>
          )}
          {wallpaper.isNew && (
            <span className="absolute top-2 right-2 bg-accent text-white text-xs px-2 py-1 rounded font-bold font-orbitron">
              NEW
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-white/70">
          <div className="bg-dark/50 p-2 rounded border border-primary/10">
            <p className="text-xs text-white/50 font-rajdhani">Resolution</p>
            <p className="text-sm font-medium font-orbitron">{formData.resolution || 'N/A'}</p>
          </div>
          <div className="bg-dark/50 p-2 rounded border border-primary/10">
            <p className="text-xs text-white/50 font-rajdhani">Downloads</p>
            <p className="text-sm font-medium font-orbitron">{wallpaper.downloads || 0}</p>
          </div>
          <div className="bg-dark/50 p-2 rounded border border-primary/10">
            <p className="text-xs text-white/50 font-rajdhani">Views</p>
            <p className="text-sm font-medium font-orbitron">{wallpaper.viewCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
        {/* Details Section */}
        <div className="bg-secondary rounded-lg p-4 md:p-6 border border-primary/20 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center font-orbitron">
            <FaFire className="mr-2 text-primary" />
            Wallpaper Details
          </h3>
          
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputClass}
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1 font-rajdhani">{formData.title.length}/100 characters</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={`${inputClass} min-h-[80px]`}
                required
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1 font-rajdhani">{formData.description.length}/500 characters</p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Wallpaper['category'] })}
                className={`${inputClass} appearance-none`}
                required
              >
                <option value="Free Fire">Free Fire</option>
                <option value="Characters">Characters</option>
                <option value="Weapons">Weapons</option>
                <option value="Elite Pass">Elite Pass</option>
                <option value="Maps">Maps</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
                <FaTags className="mr-2 text-primary inline" />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className={inputClass}
                placeholder="e.g. action, game, character"
              />
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-secondary rounded-lg p-4 md:p-6 border border-primary/20 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center font-orbitron">
            <FaCog className="mr-2 text-primary" />
            Wallpaper Settings
          </h3>
          
          <div className="space-y-4">
            {/* Published Checkbox */}
            <div className="flex items-center bg-dark/50 p-3 rounded-lg border border-primary/10">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className={checkboxClass}
              />
              <label htmlFor="isPublished" className="ml-3 block text-sm text-white font-medium font-rajdhani">
                Published
              </label>
            </div>
            {/* HD Checkbox */}
            <div className="flex items-center bg-dark/50 p-3 rounded-lg border border-primary/10">
              <input
                type="checkbox"
                id="isHD"
                checked={formData.isHD}
                onChange={(e) => setFormData({ ...formData, isHD: e.target.checked })}
                className={checkboxClass}
              />
              <label htmlFor="isHD" className="ml-3 block text-sm text-white font-medium font-rajdhani">
                HD Quality
              </label>
            </div>
            {/* New Checkbox */}
            <div className="flex items-center bg-dark/50 p-3 rounded-lg border border-primary/10">
              <input
                type="checkbox"
                id="isNew"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                className={checkboxClass}
              />
              <label htmlFor="isNew" className="ml-3 block text-sm text-white font-medium font-rajdhani">
                Mark as New
              </label>
            </div>
            {/* Trending Checkbox */}
            <div className="flex items-center bg-dark/50 p-3 rounded-lg border border-primary/10">
              <input
                type="checkbox"
                id="isTrending"
                checked={formData.isTrending}
                onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                className={checkboxClass}
              />
              <label htmlFor="isTrending" className="ml-3 block text-sm text-white font-medium font-rajdhani">
                Mark as Trending
              </label>
            </div>
          </div>
        </div>

        {/* New Image Upload Section */}
        <div className="bg-secondary rounded-lg p-4 md:p-6 border border-primary/20 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center font-orbitron">
            <FaUpload className="mr-2 text-primary" />
            Replace Image
          </h3>
          
          {/* File Input */}
          <div className="mb-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="newImageFile"
            />
            <label
              htmlFor="newImageFile"
              className={`cursor-pointer flex items-center justify-center w-full p-4 border-2 border-dashed ${
                imageError ? 'border-red-500' : 'border-primary/30 hover:border-primary/50'
              } rounded-lg transition-colors`}
            >
              <div className="text-center">
                <FaUpload className={`mx-auto h-8 w-8 ${imageError ? 'text-red-500' : 'text-primary/50'}`} />
                <p className="mt-2 text-sm text-gray-300">Click to upload new image</p>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
              </div>
            </label>
          </div>

          {/* New Image Preview */}
          {newImagePreview && (
            <div className="relative mt-4">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-primary/10 shadow-lg">
                <Image
                  src={newImagePreview}
                  alt="New image preview"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <button
                  type="button"
                  onClick={handleRemoveNewImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-400 text-center">
                New image selected - will be uploaded when you save changes
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || imageError}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-dark bg-primary border border-transparent rounded-lg shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave/> {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 