'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/app/components/TiptapEditor';
import { toast } from 'react-hot-toast';
import { Blog as BlogType } from '../../../../lib/types';
import { FaTimes } from 'react-icons/fa';
import Image from 'next/image';

// Define the structure for blog data held in state
interface BlogFormData {
  _id?: string; // Needed for edit mode
  title: string;
  intro: string; // Will map to excerpt
  content: string;
  tags: string[]; // Will also be used for seo.keywords
  seoDescription: string;
  slug: string;
  metaTitle: string; // Will map to seo.metaTitle
  category: 'news' | 'guide' | 'event' | 'update' | 'community' | '';
  status: 'draft' | 'published';
  featuredImage: {
    url: string;
    alt: string;
    caption: string;
  };
  // Add fields to preserve during edit
  views?: number;
  likes?: any[]; // TODO: Define a Like interface if needed
  comments?: any[]; // TODO: Define a Comment interface if needed
}

// Define the steps
const steps = [
  { id: 1, name: 'Title' },
  { id: 2, name: 'Introduction' },
  { id: 3, name: 'Content' },
  { id: 4, name: 'Category & SEO' },
  { id: 5, name: 'Featured Image' },
  { id: 6, name: 'Review' },
];

// Define available categories based on the schema
const categories = ['news', 'guide', 'event', 'update', 'community'];

interface BlogFormStepperProps {
  // Allow initialData to be a partial version of the main Blog type
  // Ensure it has _id if coming from edit mode
  initialData?: Partial<BlogType> & { _id?: string }; 
  isEditMode?: boolean;
}

const BlogFormStepper = ({ initialData = {}, isEditMode = false }: BlogFormStepperProps): JSX.Element => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initialize state correctly, combining defaults and initialData
  // Map fields from BlogType to BlogFormData structure if necessary
  const [formData, setFormData] = useState<Partial<BlogFormData>>(() => {
      const defaults: Partial<BlogFormData> = {
          title: '',
          intro: '',
          content: '',
          tags: [],
          seoDescription: '',
          slug: '',
          metaTitle: '',
          category: '', // Ensure default matches type
          status: 'draft',
          featuredImage: { url: '', alt: '', caption: '' },
          views: 0,
          likes: [],
          comments: [],
      };
      // Map fields from initialData (BlogType) to formData (BlogFormData)
      const mappedInitial: Partial<BlogFormData> = {
          _id: initialData._id,
          title: initialData.title || '',
          intro: initialData.excerpt || '', // Map excerpt to intro
          content: initialData.content || '',
          // Ensure category is valid or default
          category: categories.includes(initialData.category as any) ? initialData.category as BlogFormData['category'] : '',
          tags: initialData.tags || [],
          // Map SEO fields
          seoDescription: initialData.seo?.metaDescription || '',
          metaTitle: initialData.seo?.metaTitle || '',
          slug: initialData.slug || '',
          // Ensure status is valid or default
          status: (initialData.status === 'published') ? 'published' : 'draft', 
          featuredImage: {
            url: initialData.featuredImage?.url || '',
            alt: initialData.featuredImage?.alt || '',
            caption: initialData.featuredImage?.caption || ''
          },
          // Preserve these if they exist on initialData
          views: initialData.views || 0,
          likes: initialData.likes || [], // TODO: Use defined Like type if available
          comments: initialData.comments || [], // TODO: Use defined Comment type if available
      };
      // Merge defaults with mapped initial data
      return { ...defaults, ...mappedInitial };
  });

  // Effect to update form data if initialData ref changes (for edit mode updates)
  useEffect(() => {
    if (isEditMode && initialData?._id) {
       console.log("Stepper useEffect: Updating form state from initialData", initialData);
        // Map fields from initialData (BlogType) to formData (BlogFormData)
       const mappedInitial: Partial<BlogFormData> = {
            _id: initialData._id,
            title: initialData.title || '',
            intro: initialData.excerpt || '',
            content: initialData.content || '',
            category: categories.includes(initialData.category as any) ? initialData.category as BlogFormData['category'] : '',
            tags: initialData.tags || [],
            seoDescription: initialData.seo?.metaDescription || '',
            metaTitle: initialData.seo?.metaTitle || '',
            slug: initialData.slug || '',
            status: (initialData.status === 'published') ? 'published' : 'draft',
            featuredImage: {
                url: initialData.featuredImage?.url || '',
                alt: initialData.featuredImage?.alt || '',
                caption: initialData.featuredImage?.caption || ''
            },
            views: initialData.views || 0,
            likes: initialData.likes || [], // TODO: Use defined Like type if available
            comments: initialData.comments || [], // TODO: Use defined Comment type if available
        };
       // Use functional update to only overwrite fields present in mappedInitial
       setFormData(prev => ({ ...prev, ...mappedInitial }));
    }
  }, [initialData, isEditMode]);

  // --- handleNext, handlePrevious remain the same ---
   const handleNext = () => {
    // Add validation here for the current step before proceeding
    let isValid = true;
    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i; // Basic URL pattern
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // Lowercase letters, numbers, hyphens only

    switch (currentStep) {
        case 1: // Title
            if (!formData.title?.trim()) {
                toast.error('Blog Title is required.');
                isValid = false;
            }
            break;
        case 2: // Introduction
            if (!formData.intro?.trim()) {
                toast.error('Introduction/Excerpt is required.');
                isValid = false;
            }
            break;
        case 3: // Content
            if (!formData.content || formData.content.trim() === '<p></p>') {
                toast.error('Blog Content cannot be empty.');
                isValid = false;
            }
            break;
        case 4: // Category & SEO
            if (!formData.category) {
                toast.error('Category is required.');
                isValid = false;
            }
            if (!formData.slug?.trim()) {
                toast.error('URL Slug is required.');
                isValid = false;
            } else if (!slugPattern.test(formData.slug)) {
                toast.error('URL Slug can only contain lowercase letters, numbers, and hyphens (e.g., my-cool-post).');
                isValid = false;
            }
            if (!formData.seoDescription?.trim()) {
                toast.error('SEO Description is required.');
                isValid = false;
            }
            break;
        case 5: // Featured Image
            const hasImageUrl = !!formData.featuredImage?.url?.trim();
            const hasAltText = !!formData.featuredImage?.alt?.trim();
            // const urlPattern = /^(https?:\/\/|\/api\/files\/)[^\s/$.?#].[^\s]*$/i; // Allow GridFS URLs
            // Simpler check: Allow relative URLs starting with /
            const urlPattern = /^(\/|https?:\/\/)/i;

            // Check if upload is in progress
            if (uploading) {
                 toast.error('Please wait for the image upload to complete.');
                 isValid = false;
                 break; // Stop further checks for this step if uploading
            }

            // If no URL is present (neither uploaded nor manually entered)
            if (!hasImageUrl) {
                toast.error('Please upload a Featured Image or provide its URL.');
                isValid = false;
            } 
            // If URL is present, validate its format and require Alt text
            else {
                // Validate URL format (allow relative /api/files/... or absolute http/https)
                 if (!urlPattern.test(formData.featuredImage?.url || '')) {
                    toast.error('Please enter a valid URL (e.g., /api/files/... or https://...). Check for extra spaces.');
                    isValid = false;
                 }
                 // Require Alt Text if URL is valid
                if (isValid && !hasAltText) {
                    toast.error('Featured Image Alt Text is required for accessibility.');
                    isValid = false;
                }
            }
            break;
        // No validation needed for Review step (case 6) before submitting
    }

    if (!isValid) {
        return; // Stop if validation failed
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  // -------------------------------------------------

  const handleFormChange = (field: keyof BlogFormData | string, value: unknown) => {
     if (field.startsWith('featuredImage.')) {
         const key = field.split('.')[1] as keyof BlogFormData['featuredImage'];
         setFormData(prev => ({
             ...prev,
             featuredImage: {
                 ...(prev.featuredImage || { url: '', alt: '', caption: '' }),
                 [key]: value
             }
         }));
     } else {
        setFormData(prev => ({ ...prev, [field as keyof BlogFormData]: value }));
     }

    // Auto-generate slug and default meta title from title in step 1
    if (field === 'title' && currentStep === 1) {
        const titleValue = value as string;
        const slug = titleValue
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        setFormData(prev => ({
             ...prev,
             slug: prev.slug || slug, // Only set slug if it wasn't already set (e.g. from initialData)
             metaTitle: prev.metaTitle || titleValue // Only set metaTitle if it wasn't already set
         }));
    }
  };

  // --- handleAddTag, handleRemoveTag, handleContentChange remain the same ---
   const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !(formData.tags || []).includes(trimmedTag)) {
        setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), trimmedTag] }));
        setTagInput(''); // Clear input
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(tag => tag !== tagToRemove) }));
  };

   const handleContentChange = (content: string) => {
      handleFormChange('content', content);
  }
  // ------------------------------------------------------------------------

  // --- handleFileChange remains the same ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Add validation (size, type) here if needed
       if (file.size > 1 * 1024 * 1024) { // 1MB limit example
            toast.error('Thumbnail size should be less than 1MB');
            return;
        }
      handleFormChange('thumbnailFile', file);
      // TODO: Show preview if desired
    } else {
      handleFormChange('thumbnailFile', null);
    }
  };
  // -----------------------------------------

  // --- FINAL SUBMIT --- 
  const handleSubmit = async (publishStatus: 'draft' | 'published' = 'published') => {
    setIsSubmitting(true);

    // Create the final payload
    const payload = {
      _id: formData._id, // Include _id if in edit mode
      title: formData.title,
      excerpt: formData.intro, // Map intro back to excerpt
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      slug: formData.slug,
      status: publishStatus, // Set status based on button clicked
      featuredImage: {
          url: formData.featuredImage?.url,
          alt: formData.featuredImage?.alt,
          caption: formData.featuredImage?.caption,
      },
      seo: {
          metaTitle: formData.metaTitle || formData.title, // Use title if metaTitle is empty
          metaDescription: formData.seoDescription,
          keywords: formData.tags, // Use tags as keywords
      },
    };

    // Determine API method and endpoint
    const method = isEditMode ? 'PUT' : 'POST';
    const endpoint = isEditMode ? `/api/admin/blogs/${formData._id}` : '/api/admin/blogs';

    // Make API call
    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} blog post`);
      }

      toast.success(`Blog post ${isEditMode ? 'updated' : 'created'} successfully! (${publishStatus})`);
      router.push('/admin/blogs'); // Redirect to blog list
      router.refresh(); // Refresh server components

    } catch (error: unknown) {
      console.error('Form submission error:', error);
      // Type checking for error message
      let message = 'An unexpected error occurred.';
      if (error instanceof Error) {
          message = error.message;
      }
      toast.error(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataObj,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.url) {
        handleFormChange('featuredImage.url', data.url);
      } else {
        throw new Error('No URL returned');
      }
    } catch (err: unknown) {
      // Type checking for error message
      let message = 'Upload failed';
      if (err instanceof Error) {
          message = err.message;
      }
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  // Render current step content
  const renderStepContent = (): JSX.Element | null => {
    switch (currentStep) {
      case 1:
        return (
           <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-white mb-1">Blog Title</label>
            <input
              type="text"
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleFormChange('title', e.target.value)}
              className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter blog title"
              required
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-2">
            <label htmlFor="intro" className="block text-sm font-medium text-white mb-1">Short Introduction / Excerpt</label>
            <textarea
              id="intro"
              rows={4}
              value={formData.intro || ''}
              onChange={(e) => handleFormChange('intro', e.target.value)}
              className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter a brief introduction (used as excerpt)"
               required
            />
          </div>
        );
      case 3:
        return (
            <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">Full Blog Content</label>
                <TiptapEditor
                    content={formData.content || ''}
                    onChange={(content) => handleFormChange('content', content)}
                    placeholder="Start writing your blog post here..."
                />
            </div>
        );
      case 4:
        return (
          // Use responsive grid layout
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"> 
            <h3 className="md:col-span-2 text-lg font-semibold text-white mb-1">Category & SEO</h3>
            
            {/* Category Dropdown */}
            <div className="md:col-span-1">
                <label htmlFor="category" className="block text-sm font-medium text-white mb-1">Category *</label>
                <select
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => handleFormChange('category', e.target.value as BlogFormData['category'])}
                    required
                    className="input-field w-full" // Use custom input-field class or existing styling
                >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                </select>
            </div>
            
            {/* Slug Input */}
             <div className="md:col-span-1">
                <label htmlFor="slug" className="block text-sm font-medium text-white mb-1">URL Slug *</label>
                <input
                    type="text"
                    id="slug"
                    value={formData.slug || ''}
                    onChange={(e) => handleFormChange('slug', e.target.value)}
                    required
                    className="input-field w-full"
                    placeholder="e.g., my-awesome-blog-post"
                 />
             </div>
             
            {/* SEO Description */}
            <div className="md:col-span-2">
                <label htmlFor="seoDescription" className="block text-sm font-medium text-white mb-1">SEO Description *</label>
                <textarea
                    id="seoDescription"
                    rows={3}
                    maxLength={160}
                    value={formData.seoDescription || ''}
                    onChange={(e) => handleFormChange('seoDescription', e.target.value)}
                    required
                    className="input-field w-full"
                    placeholder="Short description for search results (max 160 chars)"
                />
                <p className="text-xs text-white/50 text-right mt-1">{formData.seoDescription?.length || 0}/160</p>
            </div>
            
            {/* Meta Title */}
             <div className="md:col-span-1">
                <label htmlFor="metaTitle" className="block text-sm font-medium text-white mb-1">Meta Title (Optional)</label>
                <input
                    type="text"
                    id="metaTitle"
                    value={formData.metaTitle || ''}
                    onChange={(e) => handleFormChange('metaTitle', e.target.value)}
                    className="input-field w-full"
                    placeholder="Defaults to Blog Title if empty"
                />
             </div>
             
            {/* Tags Input */} 
            <div className="md:col-span-1">
                <label htmlFor="tags" className="block text-sm font-medium text-white mb-1">Tags</label>
                <div className="flex">
                    <input
                        type="text"
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }}}
                        className="input-field flex-grow rounded-r-none"
                        placeholder="Type a tag and press Enter"
                    />
                    <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm rounded-l-none shrink-0">Add</button> 
                </div>
                 <div className="mt-2 flex flex-wrap gap-2">
                    {(formData.tags || []).map(tag => (
                        <span key={tag} className="badge badge-primary badge-sm gap-1">
                            {tag}
                            <FaTimes onClick={() => handleRemoveTag(tag)} className="cursor-pointer" size={10}/>
                        </span>
                    ))}
                </div>
            </div>
             
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                {/* Drag-and-drop upload area */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Upload Featured Image</label>
                  <div
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={async e => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file) await handleImageUpload(file);
                    }}
                    className={`mt-1 flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer transition-colors ${uploading ? 'border-primary animate-pulse' : 'border-gray-600 hover:border-primary'}`}
                    style={{ background: '#23272f' }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="featuredImageUpload"
                      onChange={async e => {
                        if (e.target.files && e.target.files[0]) {
                          await handleImageUpload(e.target.files[0]);
                        }
                      }}
                      disabled={uploading}
                    />
                    <label htmlFor="featuredImageUpload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <span className="text-gray-400 text-sm">Drag & drop or <span className="text-primary underline">click to upload</span></span>
                      {uploading && <span className="text-primary mt-2 animate-pulse">Uploading...</span>}
                      {uploadError && <span className="text-red-500 mt-2">{uploadError}</span>}
                    </label>
                  </div>
                </div>
                {/* URL input remains */}
                <div>
                    <label htmlFor="featuredImageUrl" className="block text-sm font-medium text-gray-300 mb-1">Featured Image URL</label>
                    <input type="text" id="featuredImageUrl" value={formData.featuredImage?.url || ''} onChange={(e) => handleFormChange('featuredImage.url', e.target.value)} placeholder="https://... or /uploads/..." className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
                    <p className="mt-1 text-xs text-gray-400">Paste the URL of the image (e.g., from the Media Gallery) or upload above.</p>
                </div>
                <div>
                    <label htmlFor="featuredImageAlt" className="block text-sm font-medium text-gray-300 mb-1">Featured Image Alt Text</label>
                    <input type="text" id="featuredImageAlt" value={formData.featuredImage?.alt || ''} onChange={(e) => handleFormChange('featuredImage.alt', e.target.value)} placeholder="Descriptive text for accessibility" required className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
                </div>
                 <div>
                    <label htmlFor="featuredImageCaption" className="block text-sm font-medium text-gray-300 mb-1">Featured Image Caption (Optional)</label>
                    <input type="text" id="featuredImageCaption" value={formData.featuredImage?.caption || ''} onChange={(e) => handleFormChange('featuredImage.caption', e.target.value)} placeholder="Optional caption for the image" className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"/>
                </div>
            </div>
            <div className="mt-4 md:mt-0">
                 <label className="block text-sm font-medium text-gray-300 mb-1">Image Preview</label>
                 <div className="mt-1 relative w-full aspect-video bg-gray-700 rounded-md flex items-center justify-center border border-gray-600 overflow-hidden">
                     {formData.featuredImage?.url ? (
                         <Image 
                             src={formData.featuredImage.url}
                             alt={formData.featuredImage.alt || 'Preview'}
                             fill
                             style={{ objectFit: 'cover' }}
                             onError={(e) => e.currentTarget.style.display='none'}
                         />
                     ) : (
                         <span className="text-gray-500 text-sm">No Image URL Provided</span>
                     )}
                 </div>
             </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6"> {/* Increased outer spacing */}
            <h3 className="text-xl font-bold text-white border-b border-primary/20 pb-3 mb-5">Review Your Post</h3>
            
            {/* Section 1: Basic Info */}
            <div className="bg-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold text-primary mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><strong>Title:</strong><p className="text-white/80 break-words mt-1">{formData.title || '-'}</p></div>
                  <div><strong>Slug:</strong><p className="text-white/80 break-words mt-1">{formData.slug || '-'}</p></div>
                  <div><strong>Category:</strong><p className="text-white/80 mt-1">{formData.category || '-'}</p></div>
                  <div><strong>Tags:</strong><p className="text-white/80 mt-1">{(formData.tags || []).join(', ') || '-'}</p></div>
                  <div className="md:col-span-2"><strong>Intro/Excerpt:</strong><p className="text-white/80 mt-1">{formData.intro || '-'}</p></div>
              </div>
            </div>

            {/* Section 2: SEO Info */}
            <div className="bg-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold text-primary mb-3">SEO Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                 <div className="md:col-span-2"><strong>SEO Description:</strong><p className="text-white/80 mt-1">{formData.seoDescription || '-'}</p></div>
                 <div><strong>Meta Title:</strong><p className="text-white/80 break-words mt-1">{formData.metaTitle || '[Defaults to Title]'}</p></div>
              </div>
            </div>

            {/* Section 3: Image Info */}
             <div className="bg-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold text-primary mb-3">Featured Image</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                 <div><strong>URL:</strong><p className="text-white/80 break-words mt-1">{formData.featuredImage?.url || '-'}</p></div>
                 <div><strong>Alt Text:</strong><p className="text-white/80 break-words mt-1">{formData.featuredImage?.alt || '-'}</p></div>
                 <div><strong>Caption:</strong><p className="text-white/80 break-words mt-1">{formData.featuredImage?.caption || '-'}</p></div>
               </div>
            </div>
            
            {/* Section 4: Content Preview */}
            <div className="bg-dark p-4 rounded-lg border border-gray-700">
               <h4 className="text-lg font-semibold text-primary mb-3">Content Preview</h4>
              <div 
                className="prose dark:prose-invert prose-sm max-h-60 overflow-y-auto border border-gray-600 p-3 rounded bg-secondary mt-1"
                dangerouslySetInnerHTML={{ __html: formData.content || '<p><i>No content entered.</i></p>' }}
              ></div>
            </div>
            
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
      {/* Render the content for the current step */}
      <div className="step-content mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <div className="flex gap-4">
             {/* Show Save Draft only if not already published OR if in edit mode */} 
             {(formData.status !== 'published' || isEditMode) && (
                <button
                    type="button"
                    onClick={() => handleSubmit('draft')} 
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Saving...' : 'Save Draft'}
                </button>
             )}
             <button
                 type="button"
                 onClick={() => handleSubmit('published')}
                 disabled={isSubmitting}
                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isSubmitting ? 'Publishing...' : (isEditMode && formData.status === 'published' ? 'Update Post' : 'Publish Post')}
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default BlogFormStepper; 