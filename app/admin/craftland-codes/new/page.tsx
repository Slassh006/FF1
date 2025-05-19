'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaSave, FaTimes, FaUpload, FaCheck, FaChevronDown } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { createThumbnail } from '@/app/utils/imageProcessing';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Define interfaces if needed (or keep inline)
interface SelectOption {
  value: string;
  label: string;
}

interface NewFormData {
  title: string;
  code: string;
  category: SelectOption | null;
  description: string;
  features: string[];
  difficulty: SelectOption | null;
  region: SelectOption | null;
  isActive: boolean;
  videoUrl: string;
  coverImage: string;
}

const NewCraftlandCodePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feature, setFeature] = useState('');
  const [formData, setFormData] = useState<NewFormData>({
    title: '',
    code: '',
    category: null,
    description: '',
    features: [],
    difficulty: { value: 'medium', label: 'Medium' },
    region: { value: 'GLOBAL', label: 'Global' },
    isActive: true,
    videoUrl: '',
    coverImage: '',
  });
  
  // Image States - Keep only selectedFile and preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Show error in UI
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [session, status, router]);

  // Available categories and difficulties
  const categoryOptions: SelectOption[] = [
    { value: 'Battle Arena', label: 'Battle Arena' }, { value: 'Parkour', label: 'Parkour' },
    { value: 'Survival', label: 'Survival' }, { value: 'Adventure', label: 'Adventure' },
    { value: 'Puzzle', label: 'Puzzle' }, { value: 'Racing', label: 'Racing' },
    { value: 'Training', label: 'Training' }, { value: 'Horror', label: 'Horror' },
    { value: 'Mini-game', label: 'Mini-game' }, { value: 'Other', label: 'Other' },
  ];
  const difficultyOptions: SelectOption[] = [
    { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];
  const regionOptions: SelectOption[] = [
    { value: 'GLOBAL', label: 'Global' }, { value: 'IN', label: 'India (IN)' }, 
    { value: 'ID', label: 'Indonesia (ID)' }, { value: 'BR', label: 'Brazil (BR)' }, 
    { value: 'MENA', label: 'MENA' }, { value: 'US', label: 'United States (US)' }, 
    { value: 'EU', label: 'Europe (EU)' }, { value: 'OTHER', label: 'Other' },
    // Adjust labels if needed (e.g., removing flag from label)
  ];

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- Start: Copied Handlers from /admin/craftland/new --- 
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileSelect = async (file: File | null) => {
    // Clean up previous preview URL if exists
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setSelectedFile(file);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, WEBP, GIF)');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        setSelectedFile(null);
        return;
      }
      // Set preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]); // Keep dependency

  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };
  // --- End: Copied Handlers --- 

  // Add feature to features array
  const addFeature = () => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
      setFeature('');
    }
  };

  // Remove feature from features array
  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureToRemove)
    }));
  };

  // Generate a random code
  const generateRandomCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    
    // Format: XXXX-XXXX-XXXX
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 2) result += '-';
    }
    
    setFormData(prev => ({
      ...prev,
      code: result
    }));
  };

  // Specific handlers for Listbox components
  const handleCategoryChange = (selectedOption: SelectOption | null) => {
    setFormData(prev => ({ ...prev, category: selectedOption }));
  };

  const handleDifficultyChange = (selectedOption: SelectOption | null) => {
    setFormData(prev => ({ ...prev, difficulty: selectedOption }));
  };

  const handleRegionChange = (selectedOption: SelectOption | null) => {
    setFormData(prev => ({ ...prev, region: selectedOption }));
  };

  // Handle form submission - Update validation and data appending
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate form - check selected objects
    if (!formData.title || !formData.code || !formData.category?.value || !formData.region?.value) {
      setError('Please fill in all required fields: Map Name, Code, Category, and Region.');
      setIsSubmitting(false);
      return;
    }
    if (!selectedFile) {
      setError('Please upload a cover image for the map.');
      setIsSubmitting(false);
      return;
    }

    // Add code format validation (optional but good)
    const codeRegex = /^FFCL-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
    if (!codeRegex.test(formData.code)) {
       setError('Invalid code format. Please use the format: FFCL-XXXX-XXXX');
       setIsSubmitting(false);
       return;
    }

    // Validate YouTube URL if provided
    if (formData.videoUrl) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(formData.videoUrl)) {
        setError('Please enter a valid YouTube video URL.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const submissionData = new FormData();
      // Append form fields using .value
      submissionData.append('title', formData.title);
      submissionData.append('code', formData.code);
      submissionData.append('category', formData.category.value);
      submissionData.append('description', formData.description);
      formData.features.forEach(feature => submissionData.append('features[]', feature));
      submissionData.append('difficulty', formData.difficulty?.value || 'medium');
      submissionData.append('region', formData.region.value);
      submissionData.append('isActive', formData.isActive ? 'true' : 'false');
      submissionData.append('isVerified', 'false');
      submissionData.append('author', session?.user?.name || 'Admin');
      if (formData.videoUrl) {
        submissionData.append('videoUrl', formData.videoUrl);
      }

      // Append cover image file
      submissionData.append('coverImage', selectedFile);

      // Submit to the correct ADMIN API endpoint
      const response = await fetch('/api/admin/craftland-codes', { 
        method: 'POST',
        body: submissionData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This Craftland code already exists. Please use a different code.');
        }
        throw new Error(result.error || 'Failed to add Craftland code. Please try again.');
      }

      toast.success('Craftland code added successfully!');
      router.push('/admin/craftland-codes');

    } catch (err: any) {
      console.error('Error submitting craftland code:', err);
      const errorMsg = err.message || 'Failed to add Craftland code. Please try again.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Cleanup preview URL on unmount ---
  useEffect(() => {
    return () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
    };
  }, [preview]);

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Add New Craftland Code</h1>
        </div>
        <div className="bg-secondary rounded-md p-8 text-center flex justify-center items-center min-h-[200px]">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="mr-4 text-white/70 hover:text-white p-1 rounded hover:bg-primary/10"
          aria-label="Go back"
        >
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">Add New Craftland Code</h1>
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-white px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-secondary rounded-md p-6 space-y-6">
         {/* --- Start: New Image Upload Section --- */}
         <div>
            <label className="block text-white text-sm font-medium mb-2">Cover Image <span className="text-red-500">*</span></label>
             <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-primary/30 hover:border-primary/60 bg-dark/30'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
             >
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp, image/gif" 
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} 
                />
                {preview ? (
                    <div className="relative group/preview">
                        <Image src={preview} alt="Preview" width={300} height={169} className="mx-auto max-h-48 w-auto rounded-md object-contain" />
                         <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleFileSelect(null); }} 
                            className="absolute top-1 right-1 bg-red-500/70 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/preview:opacity-100 transition-opacity"
                            aria-label="Remove image"
                         >
                            <FaTimes size={12} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-white/60">
                        <FaUpload className="text-3xl mb-2" />
                        <p>Drag & drop an image here</p>
                        <p className="text-xs">(or click to select)</p>
                        <p className="text-xs mt-1">PNG, JPG, WEBP, GIF up to 5MB</p>
                    </div>
                )}
            </div>
         </div>
         {/* --- End: New Image Upload Section --- */}

         {/* --- Start: Regular Form Fields --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-white mb-2">Map Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter map name"
              className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
              required
            />
          </div>
          {/* Code */}
          <div>
            <label htmlFor="code" className="block text-white mb-2">Code <span className="text-red-500">*</span></label>
            <div className="flex">
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="FFCL-XXXX-XXXX"
                  className="flex-grow bg-dark text-white py-2 px-4 rounded-l-md border border-primary/30 focus:border-primary focus:outline-none"
                  required
                  pattern="^FFCL-[A-Z0-9]{4}-[A-Z0-9]{4}$"
                  title="Code must be in FFCL-XXXX-XXXX format"
                />
                <button type="button" onClick={generateRandomCode} className="bg-primary/20 text-primary px-3 rounded-r-md border border-l-0 border-primary/30 hover:bg-primary/30">
                    Generate
                </button>
            </div>
          </div>
           {/* Category */}
          <div>
            <label htmlFor="category" className="block text-white mb-2">Category <span className="text-red-500">*</span></label>
            <Listbox value={formData.category} onChange={handleCategoryChange} disabled={isSubmitting}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-dark py-2 pl-3 pr-10 text-left text-white shadow-sm ring-1 ring-inset ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                  <span className="block truncate">{formData.category?.label || 'Select Category'}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-dark border border-primary/50 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {categoryOptions.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary/20 text-primary' : 'text-white'
                          }`
                        }
                        value={option}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {option.label}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                <FaCheck className="h-4 w-4" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
           {/* Difficulty */} 
          <div>
            <label htmlFor="difficulty" className="block text-white mb-2">Difficulty</label>
            <Listbox value={formData.difficulty} onChange={handleDifficultyChange} disabled={isSubmitting}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-dark py-2 pl-3 pr-10 text-left text-white shadow-sm ring-1 ring-inset ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                  <span className="block truncate">{formData.difficulty?.label || 'Select Difficulty'}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-dark border border-primary/50 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {difficultyOptions.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary/20 text-primary' : 'text-white'
                          }`
                        }
                        value={option}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {option.label}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                <FaCheck className="h-4 w-4" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
           {/* Region */}
          <div>
            <label htmlFor="region" className="block text-white mb-2">Region <span className="text-red-500">*</span></label>
            <Listbox value={formData.region} onChange={handleRegionChange} disabled={isSubmitting}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-md bg-dark py-2 pl-3 pr-10 text-left text-white shadow-sm ring-1 ring-inset ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6">
                  <span className="block truncate">{formData.region?.label || 'Select Region'}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-dark border border-primary/50 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {regionOptions.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary/20 text-primary' : 'text-white'
                          }`
                        }
                        value={option}
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {option.label}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                <FaCheck className="h-4 w-4" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
          {/* Is Active Checkbox */}
           <div className="flex items-center pt-4">
                <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange} 
                    className="w-4 h-4 text-primary bg-dark border-primary/50 rounded focus:ring-primary focus:ring-offset-secondary mr-2"
                />
                <label htmlFor="isActive" className="text-white">Active (Visible to public)</label>
            </div>
        </div>

        {/* Description */}
        <div>
            <label htmlFor="description" className="block text-white mb-2">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter map description (optional)"
              rows={4}
              className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
            ></textarea>
        </div>
        
        {/* Features */}
        <div>
          <label htmlFor="feature" className="block text-white mb-2">Features (Optional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              id="feature"
              name="feature"
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              placeholder="Enter a feature (e.g., 1v1 Arena)"
              className="flex-grow bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
            />
            <button type="button" onClick={addFeature} className="bg-primary/20 text-primary px-4 py-2 rounded-md hover:bg-primary/30">Add</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.features.map((f, index) => (
              <span key={index} className="bg-dark px-2 py-1 rounded-md text-sm text-white/80 flex items-center gap-1">
                {f}
                <button type="button" onClick={() => removeFeature(f)} className="text-red-400 hover:text-red-300">
                  <FaTimes size={12}/>
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* YouTube Video URL */}
        <div>
          <label htmlFor="videoUrl" className="block text-white mb-2">YouTube Video URL (Optional)</label>
          <input
            type="url"
            id="videoUrl"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            placeholder="https://youtube.com/..."
            pattern="^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$"
            title="Please enter a valid YouTube video URL"
            className="w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none"
          />
          <p className="text-sm text-white/60 mt-1">Add a YouTube video URL to showcase your map gameplay</p>
        </div>

        {/* --- End: Regular Form Fields --- */}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t border-primary/10">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="px-4 py-2 rounded-md text-white/70 border border-primary/30 hover:bg-primary/10"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center justify-center px-4 py-2 bg-primary text-black font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
          >
            {isSubmitting ? <LoadingSpinner size="small" /> : <FaSave className="mr-2" />}
            {isSubmitting ? '' : 'Add Code'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewCraftlandCodePage; 