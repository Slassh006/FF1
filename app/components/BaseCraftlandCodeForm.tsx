import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Listbox } from '@headlessui/react';
import { FaUpload, FaTimes, FaChevronDown, FaSave, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

// Common types
export interface SelectOption {
  value: string;
  label: string;
}

export interface FormDataState {
  code: string;
  title: string;
  description: string;
  category: SelectOption | null;
  difficulty: SelectOption | null;
  region: SelectOption | null;
  videoUrl: string;
  features: string[];
  isActive?: boolean;
  status?: SelectOption;
  isVerified?: boolean;
  author?: string;
}

// Common constants
export const defaultCategory: SelectOption = { value: 'battle-royale', label: 'Battle Royale' };
export const defaultRegion: SelectOption = { value: 'global', label: 'Global' };
export const defaultDifficulty: SelectOption = { value: 'medium', label: 'Medium' };

// Props interface
interface BaseCraftlandCodeFormProps {
  initialData?: Partial<FormDataState>;
  isAdmin?: boolean;
  onSubmit: (formData: FormData, isActive?: boolean) => Promise<void>;
  submitButtonText?: string;
}

export default function BaseCraftlandCodeForm({
  initialData,
  isAdmin = false,
  onSubmit,
  submitButtonText = 'Submit Code'
}: BaseCraftlandCodeFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [oldCoverImage, setOldCoverImage] = useState<string | null>(initialData?.coverImage || null);

  // Initialize form data with defaults or initial values
  const [formData, setFormData] = useState<FormDataState>({
    code: initialData?.code || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || defaultCategory,
    difficulty: initialData?.difficulty || defaultDifficulty,
    region: initialData?.region || defaultRegion,
    videoUrl: initialData?.videoUrl || '',
    features: initialData?.features || [],
    isActive: initialData?.isActive ?? false,
    status: initialData?.status || { value: 'pending', label: 'Pending' },
    isVerified: initialData?.isVerified ?? false,
    author: initialData?.author || ''
  });

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange({ target: { files: [file] } } as any);
    }
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous preview URL if exists
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, WEBP, GIF)');
        setSelectedFile(null);
        setPreview(null);
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        setSelectedFile(null);
        setPreview(null);
        return;
      }

      // If we're editing and there's an old cover image, mark it for deletion
      if (initialData?._id && oldCoverImage) {
        setOldCoverImage(oldCoverImage);
      }

      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Common handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormDataState) => (selectedOption: SelectOption | null) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption }));
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error('Please sign in to submit codes');
      return;
    }

    // Validation
    if (!selectedFile && !initialData) {
      toast.error('Please select a cover image');
      return;
    }

    if (!formData.code || !formData.title || !formData.description || !formData.category?.value || !formData.region?.value) {
      toast.error('Please fill in all required fields (*)');
      return;
    }

    // Validate code format
    const codeRegex = /^FFCL-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
    if (!codeRegex.test(formData.code)) {
      toast.error('Invalid code format. Use FFCL-XXXX-XXXX');
      return;
    }

    // Validate YouTube URL if provided
    if (formData.videoUrl && !formData.videoUrl.match(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/)) {
      toast.error('Please enter a valid YouTube video URL');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Append basic fields
      formDataToSend.append('code', formData.code);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category.value);
      formDataToSend.append('region', formData.region.value);
      formDataToSend.append('difficulty', formData.difficulty?.value || 'medium');
      
      // Append features
      formData.features.forEach(feature => {
        formDataToSend.append('features[]', feature);
      });

      // Append video URL if provided
      if (formData.videoUrl) {
        formDataToSend.append('videoUrl', formData.videoUrl);
      }

      // Append file if selected
      if (selectedFile) {
        formDataToSend.append('coverImage', selectedFile);
      }

      // If we're editing and there's an old cover image to delete
      if (initialData?._id && oldCoverImage && selectedFile) {
        formDataToSend.append('oldCoverImage', oldCoverImage);
      }

      // Append admin fields if in admin mode
      if (isAdmin) {
        formDataToSend.append('status', formData.status?.value || 'pending');
        formDataToSend.append('isVerified', formData.isVerified ? 'true' : 'false');
        formDataToSend.append('author', formData.author || 'Admin');
      }

      // Call the provided onSubmit handler
      await onSubmit(formDataToSend, formData.isActive);
      
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common styles
  const inputClass = "w-full bg-dark text-white py-2 px-4 rounded-md border border-primary/30 focus:border-primary focus:outline-none";
  const labelClass = "block text-white mb-2";
  const listboxButtonClass = "relative w-full cursor-default rounded-md bg-dark py-2 pl-3 pr-10 text-left text-white shadow-sm ring-1 ring-inset ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6";
  const listboxOptionsClass = "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-dark border border-primary/50 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm";

  return (
    <form onSubmit={handleSubmit} className="bg-secondary rounded-md p-6 space-y-6">
      <p className="text-sm text-white/60 mb-4">
        {isAdmin ? 'Add a new Craftland code to the system.' : 'Submit your Craftland code for others to discover.'} 
        Fields marked with * are required.
      </p>
      
      {/* Cover Image Upload */}
      <div>
        <label className={labelClass}>
          Cover Image {!initialData && <span className="text-red-500">*</span>}
        </label>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-primary/30 hover:border-primary/60 bg-dark/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp, image/gif" 
            onChange={handleFileChange}
          />
          {preview ? (
            <div className="relative group/preview">
              <img src={preview} alt="Preview" className="mx-auto max-h-48 w-auto rounded-md object-contain" />
              <button 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation();
                  if (preview) URL.revokeObjectURL(preview);
                  setSelectedFile(null); 
                  setPreview(null); 
                }} 
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

      {/* Basic Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className={labelClass}>
            Map Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter map name"
            className={inputClass}
            required
          />
        </div>

        {/* Code */}
        <div>
          <label htmlFor="code" className={labelClass}>
            Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            placeholder="FFCL-XXXX-XXXX"
            className={inputClass}
            required
            pattern="^FFCL-[A-Z0-9]{4}-[A-Z0-9]{4}$"
            title="Code must be in FFCL-XXXX-XXXX format"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className={labelClass}>
            Category <span className="text-red-500">*</span>
          </label>
          <Listbox value={formData.category} onChange={handleSelectChange('category')} disabled={isSubmitting}>
            <div className="relative">
              <Listbox.Button className={listboxButtonClass}>
                <span className="block truncate">{formData.category?.label || 'Select Category'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Listbox.Options className={listboxOptionsClass}>
                {[
                  { value: 'battle-royale', label: 'Battle Royale' },
                  { value: 'deathmatch', label: 'Deathmatch' },
                  { value: 'custom', label: 'Custom' }
                ].map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-primary/20 text-white' : 'text-white/70'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                            <FaCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Region */}
        <div>
          <label htmlFor="region" className={labelClass}>
            Region <span className="text-red-500">*</span>
          </label>
          <Listbox value={formData.region} onChange={handleSelectChange('region')} disabled={isSubmitting}>
            <div className="relative">
              <Listbox.Button className={listboxButtonClass}>
                <span className="block truncate">{formData.region?.label || 'Select Region'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Listbox.Options className={listboxOptionsClass}>
                {[
                  { value: 'global', label: 'Global' },
                  { value: 'india', label: 'India' },
                  { value: 'asia', label: 'Asia' },
                  { value: 'europe', label: 'Europe' },
                  { value: 'americas', label: 'Americas' }
                ].map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-primary/20 text-white' : 'text-white/70'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                            <FaCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className={labelClass}>Difficulty</label>
          <Listbox value={formData.difficulty} onChange={handleSelectChange('difficulty')} disabled={isSubmitting}>
            <div className="relative">
              <Listbox.Button className={listboxButtonClass}>
                <span className="block truncate">{formData.difficulty?.label || 'Select Difficulty'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Listbox.Options className={listboxOptionsClass}>
                {[
                  { value: 'easy', label: 'Easy' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'hard', label: 'Hard' }
                ].map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-primary/20 text-white' : 'text-white/70'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                            <FaCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className={inputClass}
          required
          placeholder="Describe your map..."
        />
      </div>

      {/* Features */}
      <div>
        <label className={labelClass}>Features</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            placeholder="Add a feature..."
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleAddFeature}
            className="px-4 py-2 bg-primary/20 text-white rounded-md hover:bg-primary/30"
          >
            Add
          </button>
        </div>
        {formData.features.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-white text-sm"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(index)}
                  className="hover:text-red-400"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* YouTube Video URL */}
      <div>
        <label htmlFor="videoUrl" className={labelClass}>YouTube Video URL (Optional)</label>
        <input
          type="url"
          id="videoUrl"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleInputChange}
          placeholder="https://youtube.com/..."
          className={inputClass}
        />
        <p className="text-sm text-white/60 mt-1">Add a YouTube video URL to showcase your map gameplay</p>
        {/* YouTube Preview */}
        {(() => {
          const url = formData.videoUrl.trim();
          // Extract YouTube video ID
          const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/);
          const videoId = match ? match[1] : null;
          if (videoId) {
            return (
              <div className="mt-3 w-full max-w-2xl mx-auto">
                <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden shadow-lg border border-primary/20 bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                  ></iframe>
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Admin-only: Active Status */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="rounded border-primary/30 text-primary focus:ring-primary"
          />
          <label htmlFor="isActive" className={labelClass}>Active (Visible to Public)</label>
        </div>
      )}

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
          {isSubmitting ? 'Submitting...' : submitButtonText}
        </button>
      </div>
    </form>
  );
} 