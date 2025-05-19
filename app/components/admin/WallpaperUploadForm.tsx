'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { FaUpload, FaImage, FaTimes } from 'react-icons/fa';
import { RESOLUTIONS, Resolution, createThumbnail, cropImage, getImageDimensions } from '@/app/utils/imageProcessing';
import { Wallpaper } from '@/app/types/wallpaper';

export default function WallpaperUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Free Fire',
    resolution: RESOLUTIONS.MOBILE,
    tags: '',
    isPublished: true,
    isHD: false,
    isNew: true,
    isTrending: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(RESOLUTIONS.MOBILE);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'cropped' | 'original'>('cropped');

  // Define shared input classes for consistency
  const inputBaseClass = "block w-full rounded-lg border bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-2";
  const inputBorderClass = "border-gray-700 focus:border-primary focus:ring-primary";
  const inputPaddingClass = "px-4 py-2";
  const inputClass = `${inputBaseClass} ${inputBorderClass} ${inputPaddingClass}`;
  const checkboxClass = "h-5 w-5 rounded bg-dark border-gray-600 text-primary focus:ring-primary focus:ring-offset-secondary"; // Consistent checkbox style

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  }, []);

  const handleFile = async (file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }

      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      if (dimensions.width < 1080 || dimensions.height < 1080) {
        toast.error('Image dimensions should be at least 1080x1080');
        return;
      }
      
      setOriginalDimensions(dimensions); // Store original dimensions

      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    } catch (error) {
      toast.error('Error processing image');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting wallpaper upload process...');
      
      // Create thumbnail
      console.log('Creating thumbnail...');
      const thumbnailBlob = await createThumbnail(selectedFile);
      const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
      console.log('Thumbnail created successfully');

      // Crop image to selected resolution (only if mode is 'cropped')
      let croppedFile: File | null = null;
      if (uploadMode === 'cropped') {
        console.log('Cropping image...');
        const croppedBlob = await cropImage(selectedFile, selectedResolution);
        croppedFile = new File([croppedBlob], 'wallpaper.jpg', { type: 'image/jpeg' });
        console.log('Image cropped successfully');
      } else {
        console.log('Skipping cropping, using original image.');
      }

      // Upload files
      console.log('Preparing form data...');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('originalImage', selectedFile);
      if (uploadMode === 'cropped' && croppedFile) {
        formDataToSend.append('croppedImage', croppedFile);
      }
      formDataToSend.append('thumbnail', thumbnailFile);
      const resolutionToSend = uploadMode === 'original' ? originalDimensions : selectedResolution;
      formDataToSend.append('resolution', JSON.stringify(resolutionToSend));
      formDataToSend.append('uploadMode', uploadMode);
      formDataToSend.append('isPublished', String(formData.isPublished));
      formDataToSend.append('isHD', String(formData.isHD));
      formDataToSend.append('isNew', String(formData.isNew));
      formDataToSend.append('isTrending', String(formData.isTrending));

      console.log('Sending request to API...');
      const response = await fetch('/api/admin/wallpapers', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        let errorMsg = 'Failed to upload wallpaper';
        let errorDetails = null;
        try {
          // Try to parse the error response as JSON
          errorDetails = await response.json();
          errorMsg = errorDetails?.error || errorDetails?.message || JSON.stringify(errorDetails);
        } catch (jsonError) {
          // If JSON parsing fails, try to read as text
          try {
            errorMsg = await response.text();
          } catch (textError) {
            // Fallback if text reading also fails
            errorMsg = `Upload failed with status: ${response.status} ${response.statusText}`;
          }
        }

        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorDetails || errorMsg, // Log parsed JSON or text
        });

        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          setIsUploading(false); // Ensure loading state is reset
          return; // Exit early
        }
        
        // Use the parsed/retrieved error message
        throw new Error(errorMsg);
      }

      const wallpaper: Wallpaper = await response.json();
      console.log('Upload successful:', wallpaper);
      toast.success('Wallpaper uploaded successfully');
      router.push('/admin/wallpapers');
      router.refresh();

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Free Fire',
        resolution: RESOLUTIONS.MOBILE,
        tags: '',
        isPublished: true,
        isHD: false,
        isNew: true,
        isTrending: false
      });
      setSelectedFile(null);
      setPreview(null);
      setOriginalDimensions(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error during wallpaper upload process:', error); // Changed log message slightly
      // Display the specific error message from the throw or a generic one
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred during upload'); 
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Use secondary background, consistent padding/border */}
      <div className="bg-secondary rounded-lg p-6 md:p-8 border border-primary/20 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 font-orbitron">Add New Wallpaper</h2>
        
        {/* Image Upload Area - Apply theme styles */}
        <div 
          className={`relative border-2 border-dashed rounded-lg p-6 md:p-8 text-center mb-6 transition-colors
            ${dragActive ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-primary/50'}
            ${preview ? 'border-primary/50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />
          
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg object-contain border border-gray-700"
              />
              <button
                type="button"
                onClick={() => { setPreview(null); setSelectedFile(null); setOriginalDimensions(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                // Style close button
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                aria-label="Remove image"
              >
                <FaTimes size={14} />
              </button>
            </div>
          ) : (
             <div className="space-y-3 md:space-y-4">
              <div className="flex justify-center">
                <FaImage className="w-12 h-12 md:w-16 md:h-16 text-gray-500" />
              </div>
              <div>
                {/* Use themed secondary button style */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-secondary"
                >
                  Choose File
                </button>
              </div>
              <p className="text-sm text-gray-400">or drag and drop</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
          
          {/* Display Original Dimensions if available */}
          {originalDimensions && (
            <p className="text-xs text-center text-gray-400 mt-2 font-rajdhani">
              Detected: {originalDimensions.width} x {originalDimensions.height} pixels
            </p>
          )}
        </div>

        {/* Add Upload Mode Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2 font-rajdhani">Upload Option</label>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="flex items-center space-x-2 cursor-pointer bg-dark/50 p-3 rounded-lg border border-primary/10 flex-1">
              <input 
                type="radio" 
                name="uploadMode" 
                value="cropped" 
                checked={uploadMode === 'cropped'} 
                onChange={() => setUploadMode('cropped')} 
                className="form-radio h-4 w-4 text-primary bg-dark border-gray-600 focus:ring-primary focus:ring-offset-secondary"
              />
              <span className="text-white text-sm">Crop to Selected Resolution</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer bg-dark/50 p-3 rounded-lg border border-primary/10 flex-1">
              <input 
                type="radio" 
                name="uploadMode" 
                value="original" 
                checked={uploadMode === 'original'} 
                onChange={() => setUploadMode('original')} 
                className="form-radio h-4 w-4 text-primary bg-dark border-gray-600 focus:ring-primary focus:ring-offset-secondary"
              />
              <span className="text-white text-sm">Use Original Image</span>
            </label>
          </div>
        </div>

        {/* Form Fields - Apply theme styles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass} // Use themed class
              placeholder="Enter wallpaper title"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={`${inputClass} appearance-none`} // Use themed class
            >
               {/* Add categories dynamically? */}
               <option value="Free Fire">Free Fire</option>
               <option value="Characters">Characters</option>
               <option value="Weapons">Weapons</option>
               <option value="Elite Pass">Elite Pass</option>
               <option value="Maps">Maps</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
             <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`${inputClass} min-h-[80px]`} // Use themed class
              placeholder="Enter wallpaper description"
            />
          </div>
          
          {/* Target Resolution Selection - Conditionally relevant */}
           <div className={`${uploadMode === 'original' ? 'opacity-60 cursor-not-allowed' : ''} transition-opacity duration-300`}>
            <label htmlFor="targetResolution" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">
              {uploadMode === 'cropped' ? 'Target Resolution (for cropping)' : 'Resolution (Original Used)'}
            </label>
            <select
              id="targetResolution"
              value={selectedResolution.label}
              onChange={(e) => {
                if (uploadMode === 'cropped') {
                  const newResolution = Object.values(RESOLUTIONS).find(r => r.label === e.target.value);
                  if (newResolution) {
                    setSelectedResolution(newResolution);
                  }
                }
              }}
              className={`${inputClass} appearance-none ${uploadMode === 'original' ? 'pointer-events-none' : ''}`}
              required={uploadMode === 'cropped'}
              disabled={uploadMode === 'original'}
              aria-disabled={uploadMode === 'original'}
            >
              {Object.values(RESOLUTIONS).map(res => (
                <option key={res.label} value={res.label}>
                  {res.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1 font-rajdhani">
              {uploadMode === 'cropped' ? 'The uploaded image will be cropped to fit this aspect ratio.' : 'Original image resolution will be used. Cropping disabled.'}
            </p>
          </div>
          
          {/* Tags */}
          <div className="md:col-span-2">
             <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1 font-rajdhani">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className={inputClass} // Use themed class
              placeholder="e.g. action, game, character"
            />
          </div>
        </div>
        
        {/* Divider */}
        <hr className="border-gray-700 my-6" />

        {/* Settings Checkboxes */}
         <div className="space-y-4">
             <h3 className="text-lg font-semibold text-white mb-3 font-orbitron">Settings</h3>
             {/* Published */}
             <div className="flex items-center bg-dark/50 p-3 rounded-lg border border-primary/10">
               <input type="checkbox" id="isPublished" name="isPublished" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className={checkboxClass} />
               <label htmlFor="isPublished" className="ml-3 block text-sm text-white font-medium font-rajdhani">Published</label>
            </div>
             {/* HD */}
             <div className="flex items-center bg-dark/50 p-3 rounded-lg border border-primary/10">
               <input type="checkbox" id="isHD" name="isHD" checked={formData.isHD} onChange={(e) => setFormData({ ...formData, isHD: e.target.checked })} className={checkboxClass} />
               <label htmlFor="isHD" className="ml-3 block text-sm text-white font-medium font-rajdhani">HD Quality</label>
            </div>
             {/* New */}
             <div className="flex items-center bg-dark/50 p-3 rounded-lg border border-primary/10">
               <input type="checkbox" id="isNew" name="isNew" checked={formData.isNew} onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })} className={checkboxClass} />
               <label htmlFor="isNew" className="ml-3 block text-sm text-white font-medium font-rajdhani">Mark as New</label>
            </div>
             {/* Trending */}
             <div className="flex items-center bg-dark/50 p-3 rounded-lg border border-primary/10">
               <input type="checkbox" id="isTrending" name="isTrending" checked={formData.isTrending} onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })} className={checkboxClass} />
               <label htmlFor="isTrending" className="ml-3 block text-sm text-white font-medium font-rajdhani">Mark as Trending</label>
            </div>
         </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
           <button
            type="submit"
            disabled={isUploading}
             // Use themed primary button style
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-dark bg-primary border border-transparent rounded-lg shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaUpload/> {isUploading ? 'Uploading...' : 'Upload Wallpaper'}
          </button>
        </div>
      </div>
    </form>
  );
} 