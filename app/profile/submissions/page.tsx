'use client';

import React, { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
    FaThumbsUp, FaThumbsDown, FaHeart, FaCheck, FaTimes, FaExclamationTriangle,
    FaUpload, FaImage, FaSpinner, FaPencilAlt, FaTrash, FaChevronDown, FaSave, FaUser, FaEnvelope, FaLink, FaLock, FaBell, FaEye, FaPaintBrush, FaFont, FaGift
} from 'react-icons/fa';
import Image from 'next/image';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import AvatarUpload from '../../components/AvatarUpload';
import { useRouter, useSearchParams } from 'next/navigation'; // Use next/navigation for App Router

// Use the more complete list of regions from the admin form
const regions = [
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MENA', name: 'Middle East', flag: '🌍' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'EU', name: 'Europe', flag: '🇪🇺' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'SA', name: 'South America', flag: '🌎' },
    { code: 'NA', name: 'North America', flag: '🌎' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'GLOBAL', name: 'Global', flag: '🌐' }
];

interface CraftlandSubmission {
  _id: string;
  code: string;
  title: string;
  description: string;
  region: string;
  status: 'pending' | 'verified' | 'rejected' | 'removed';
  upvotes: string[];
  downvotes: string[];
  likes: string[];
  createdAt: string;
  isFraudulent: boolean;
  category?: string;
  difficulty?: string;
  coverImage?: string;
  tags?: string[];
  creator?: {
    name: string;
    avatar?: string;
  };
  videoUrl?: string;
}

// Define Option type
interface SelectOption {
  value: string;
  label: string;
}

// Define options as objects
const categoryOptions: SelectOption[] = [
    { value: 'Battle Arena', label: 'Battle Arena' },
    { value: 'Survival', label: 'Survival' },
    { value: 'Parkour', label: 'Parkour' },
    { value: 'Defense', label: 'Defense' },
    { value: 'Racing', label: 'Racing' },
    { value: 'Adventure', label: 'Adventure' },
    { value: 'Puzzle', label: 'Puzzle' },
    { value: 'Other', label: 'Other' },
];

const difficultyOptions: SelectOption[] = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

// Map existing regions array to SelectOption format
const regionOptions: SelectOption[] = regions.map(r => ({ value: r.code, label: `${r.flag} ${r.name}` }));

// Helper to find option object by value
const findOption = (options: SelectOption[], value: string | undefined | null): SelectOption | null => {
  if (value === null || value === undefined) return null;
  return options.find(opt => opt.value === value) || null;
};

// Default options
const defaultCategory = findOption(categoryOptions, 'Parkour');
const defaultDifficulty = findOption(difficultyOptions, 'medium');
const defaultRegion = findOption(regionOptions, 'IN');

// Helper to capitalize first letter for display
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Update state interface
interface SubmissionState {
    code: string;
    title: string;
    description: string;
    region: SelectOption | null;
    category: SelectOption | null;
    difficulty: SelectOption | null;
    tags: string;
    videoUrl: string;
}

export default function SubmissionsPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const [submissions, setSubmissions] = useState<CraftlandSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [submissionsError, setSubmissionsError] = useState('');
  const [newSubmission, setNewSubmission] = useState<SubmissionState>({
    code: '',
    title: '',
    description: '',
    region: defaultRegion,
    category: defaultCategory,
    difficulty: defaultDifficulty,
    tags: '',
    videoUrl: '',
  });
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); // Add state for form errors

  // State for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const router = useRouter(); // Use next/navigation for App Router

  const searchParams = useSearchParams();

  // Fetch user's submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setSubmissionsLoading(true);
        setSubmissionsError('');
        const response = await fetch('/api/profile/craftland-codes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const data = await response.json();
        setSubmissions(data.submissions);
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setSubmissionsError('Failed to load your submissions. Please try again.');
      } finally {
        setSubmissionsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchSubmissions();
    }
  }, [session]);

  // Update handleChange to exclude selects
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSubmission(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add specific handlers for Listboxes
  const handleCategoryChange = (selectedOption: SelectOption | null) => {
    setNewSubmission(prev => ({ ...prev, category: selectedOption }));
  };
  const handleDifficultyChange = (selectedOption: SelectOption | null) => {
    setNewSubmission(prev => ({ ...prev, difficulty: selectedOption }));
  };
  const handleRegionChange = (selectedOption: SelectOption | null) => {
    setNewSubmission(prev => ({ ...prev, region: selectedOption }));
  };

  // --- File Handling Logic (adapted from admin form) ---
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
    if (preview) { URL.revokeObjectURL(preview); }
    setSelectedFile(file);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a JPG, PNG, or GIF image.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image is too large. Max 5MB.');
        setSelectedFile(null);
        return;
      }
      setPreview(URL.createObjectURL(file));
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
  }, [handleFileSelect]);
  // --- End File Handling Logic ---

  // Update Edit Handling to use findOption
  const handleEditClick = (submission: CraftlandSubmission) => {
    setEditingId(submission._id);
    setNewSubmission({
      code: submission.code,
      title: submission.title,
      description: submission.description,
      region: findOption(regionOptions, submission.region) || defaultRegion,
      category: findOption(categoryOptions, submission.category) || defaultCategory,
      difficulty: findOption(difficultyOptions, submission.difficulty) || defaultDifficulty,
      tags: submission.tags?.join(', ') || '',
      videoUrl: submission.videoUrl || '',
    });
    setPreview(submission.coverImage || null);
    setSelectedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // Update Cancel Edit to reset with default objects
  const handleCancelEdit = () => {
    setEditingId(null);
    setNewSubmission({
      code: '',
      title: '',
      description: '',
      region: defaultRegion,
      category: defaultCategory,
      difficulty: defaultDifficulty,
      tags: '',
      videoUrl: '',
    });
    setPreview(null);
    setSelectedFile(null);
    setFormError(null); // Also reset form error on cancel
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  // --- Delete Handling ---
  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      // Use a profile-specific delete endpoint
      const response = await fetch(`/api/profile/craftland-codes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMsg = 'Failed to delete submission.';
        try {
            const errorData = await response.json();
            errorMsg = errorData?.error || errorMsg;
        } catch { /* Ignore JSON parsing error */ }
        throw new Error(errorMsg);
      }

      // Remove deleted submission from state
      setSubmissions(prev => prev.filter(sub => sub._id !== id));
      toast.success('Submission deleted successfully.');

    } catch (err: any) {
      console.error('Error deleting submission:', err);
      toast.error('Could not remove submission. Please try again.');
    }
  };
  // --- End Delete Handling ---

  // *** CORRECTED handleSubmit for Craftland Code Form ***
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmittingForm(true);
      setFormError(null); // Use the correct state setter

      // Validate YouTube URL if provided
      if (newSubmission.videoUrl) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!youtubeRegex.test(newSubmission.videoUrl)) {
          setFormError('Please enter a valid YouTube video URL.');
          setIsSubmittingForm(false);
          return;
        }
      }

      try {
          const apiUrl = editingId
              ? `/api/profile/craftland-codes/${editingId}`
              : '/api/craftland-codes';
          const method = editingId ? 'PUT' : 'POST';

          let response: Response;

          // Use FormData if a file is selected
          if (selectedFile) {
              const formData = new FormData();
              formData.append('title', newSubmission.title || '');
              formData.append('code', newSubmission.code || '');
              formData.append('description', newSubmission.description || '');
              // Ensure tags are stringified correctly from the input string
              const tagsArray = newSubmission.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
              formData.append('tags', JSON.stringify(tagsArray));
              formData.append('coverImage', selectedFile);
              if (newSubmission.region) formData.append('region', newSubmission.region.value);
              if (newSubmission.category) formData.append('category', newSubmission.category.value);
              if (newSubmission.difficulty) formData.append('difficulty', newSubmission.difficulty.value);
              if (newSubmission.videoUrl) formData.append('videoUrl', newSubmission.videoUrl);

              response = await fetch(apiUrl, {
                  method: method,
                  body: formData, // Send FormData
              });
          } else {
              // Send JSON if no file is selected (or if editing without changing cover image)
              const payload = {
                  title: newSubmission.title,
                  code: newSubmission.code,
                  description: newSubmission.description,
                  region: newSubmission.region?.value,
                  category: newSubmission.category?.value,
                  difficulty: newSubmission.difficulty?.value,
                  tags: newSubmission.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                  videoUrl: newSubmission.videoUrl,
              };

              response = await fetch(apiUrl, {
                  method: method,
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload),
              });
          }

          let data: any = {};
          try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
          } catch (e) {
            data = {};
          }

          if (!response.ok) {
            if (response.status === 409 && data.error && data.error.includes('already exists')) {
              toast.error('This code already exists. Try a different one.');
              setFormError('This code already exists. Try a different one.');
              setIsSubmittingForm(false);
              return;
            }
              throw new Error(data.error || `Failed to ${editingId ? 'update' : 'add'} submission`);
          }

          toast.success(`Submission ${editingId ? 'updated' : 'added'} successfully!`);

          // Update the local state with the new/updated submission
          if (editingId) {
              setSubmissions(prev =>
                  prev.map(sub => sub._id === editingId ? data.submission : sub)
              );
          } else {
              // Add the new submission to the beginning of the list
              setSubmissions(prev => [data.submission, ...prev]);
          }

          handleCancelEdit(); // Reset form instead of closing modal

      } catch (err: any) {
          console.error("Submission error:", err);
          setFormError('Something went wrong. Please try again.'); // Use correct state setter
      } finally {
          setIsSubmittingForm(false);
      }
  };

  // Get status badge component
  const StatusBadge = ({ status, isFraudulent }: { status: string; isFraudulent: boolean }) => {
    if (isFraudulent) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
          <FaExclamationTriangle /> Fraudulent
        </span>
      );
    }

    switch (status) {
      case 'verified':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
            <FaCheck /> Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 flex items-center gap-1">
            <FaTimes /> Rejected
          </span>
        );
      case 'removed':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400 flex items-center gap-1">
            <FaTimes /> Removed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
            <FaCheck /> Pending
          </span>
        );
    }
  };

  const listboxButtonClass = "w-full bg-secondary text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50 appearance-none relative text-left sm:text-sm";
  const listboxOptionsClass = "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-dark border border-primary/50 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm";

  if (submissionsLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* --- Modified New/Edit Submission Form --- */}
      <div className="bg-dark rounded-lg p-6 mb-8 border border-primary/10">
        <h2 className="text-xl font-bold text-white mb-4">
          {editingId ? 'Edit Submission' : 'Submit New Code'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-white/70 mb-1 text-sm">Code Title <span className="text-red-500">*</span></label>
              <input
                id="title"
                type="text"
                name="title"
                value={newSubmission.title}
                onChange={handleChange}
                placeholder="Enter a title for your code"
                className="w-full bg-secondary text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50"
                required
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-white/70 mb-1 text-sm">Craftland Code <span className="text-red-500">*</span></label>
              <input
                id="code"
                type="text"
                name="code"
                value={newSubmission.code}
                onChange={handleChange}
                placeholder="Format: FFCL-XXXX-XXXX"
                className="w-full bg-secondary text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50"
                required
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label htmlFor="description" className="block text-white/70 mb-1 text-sm">Description <span className="text-red-500">*</span></label>
            <textarea
              id="description"
              name="description"
              value={newSubmission.description}
              onChange={handleChange}
              placeholder="Describe your craftland code"
              className="w-full bg-secondary text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50"
              rows={3}
              required
            />
          </div>

          {/* Row 3: Category, Difficulty, Region */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Listbox */}
            <div>
              <label htmlFor="category" className="block text-white/70 mb-1 text-sm">Category <span className="text-red-500">*</span></label>
              <Listbox value={newSubmission.category} onChange={handleCategoryChange}>
                <div className="relative">
                  <Listbox.Button className={listboxButtonClass}>
                    <span className="block truncate">{newSubmission.category?.label || 'Select Category'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className={listboxOptionsClass}>
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
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                  <FaCheck className="h-5 w-5" aria-hidden="true" />
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
            
            {/* Difficulty Listbox */}
            <div>
              <label htmlFor="difficulty" className="block text-white/70 mb-1 text-sm">Difficulty Level <span className="text-red-500">*</span></label>
              <Listbox value={newSubmission.difficulty} onChange={handleDifficultyChange}>
                 <div className="relative">
                  <Listbox.Button className={listboxButtonClass}>
                    <span className="block truncate">{newSubmission.difficulty?.label || 'Select Difficulty'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className={listboxOptionsClass}>
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
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                  <FaCheck className="h-5 w-5" aria-hidden="true" />
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

            {/* Region Listbox */}
            <div>
              <label htmlFor="region" className="block text-white/70 mb-1 text-sm">Region <span className="text-red-500">*</span></label>
               <Listbox value={newSubmission.region} onChange={handleRegionChange}>
                 <div className="relative">
                  <Listbox.Button className={listboxButtonClass}>
                    <span className="block truncate">{newSubmission.region?.label || 'Select Region'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className={listboxOptionsClass}>
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
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                  <FaCheck className="h-5 w-5" aria-hidden="true" />
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
          </div>

          {/* Add Row for Tags */}
          <div>
            <label htmlFor="tags" className="block text-white/70 mb-1 text-sm">Tags (comma-separated, optional)</label>
            <input
              id="tags"
              type="text"
              name="tags"
              value={newSubmission.tags}
              onChange={handleChange}
              placeholder="e.g. pvp, fun, 1v1, hard"
              className="w-full bg-secondary text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50"
            />
             <p className="text-xs text-white/50 mt-1">Separate tags with commas. Max 25 chars per tag.</p>
          </div>

          {/* YouTube Video URL */}
          <div>
            <label htmlFor="videoUrl" className="block text-white/70 mb-1 text-sm">YouTube Video URL (Optional)</label>
            <input
              id="videoUrl"
              type="url"
              name="videoUrl"
              value={newSubmission.videoUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/..."
              className="w-full bg-secondary text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50"
            />
            <p className="text-xs text-white/50 mt-1">Add a YouTube video URL to showcase your map gameplay</p>
            {/* YouTube Preview */}
            {(() => {
              const url = newSubmission.videoUrl.trim();
              // Extract YouTube video ID
              const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/);
              const videoId = match ? match[1] : null;
              if (videoId) {
                return (
                  <div className="mt-3">
                    <iframe
                      width="100%"
                      height="220"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-lg border border-primary/20"
                    ></iframe>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Row 4: Cover Image Upload */}
          <div>
            <label className="block text-white/70 mb-1 text-sm">Cover Image <span className="text-red-500">*</span></label>
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()} // Allow clicking to upload
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${dragActive ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-gray-500'} ${preview ? 'border-solid' : ''}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/png, image/gif"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />
                {preview ? (
                    <Image
                        src={preview}
                        alt="Image Preview"
                        fill
                        style={{ objectFit: 'contain' }}
                        className="rounded-lg p-1"
                    />
                ) : (
                    <div className="text-center text-gray-400">
                        <FaUpload className="mx-auto h-8 w-8 mb-2" />
                        <p>Drag & drop an image here, or click to browse</p>
                        <p className="text-xs mt-1">JPG, PNG, GIF up to 5MB</p>
                    </div>
                )}
            </div>
          </div>

          {/* Error Display - Make sure this uses formError */}
          {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                <p className="text-red-400 text-sm font-medium">{formError}</p>
              </div>
          )} 

          {/* Submit/Update Button */}
          <div className="flex justify-end gap-4">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn-secondary px-6 py-2" // Use btn-secondary
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmittingForm}
              className="btn-primary px-6 py-2 flex items-center" // Use btn-primary
            >
              {isSubmittingForm ? <FaSpinner className="animate-spin inline mr-2" /> : null}
              {editingId ? 'Update Code' : 'Submit Code'}
            </button>
          </div>
        </form>
      </div>

      {/* --- Modified Existing Submissions List --- */}
      <div className="bg-dark rounded-lg p-6 border border-primary/10">
        <h2 className="text-xl font-bold text-white mb-4">Your Submissions</h2>
        {submissions.length === 0 && !submissionsLoading && (
          <p className="text-white/50 text-center py-4">You haven't submitted any craftland codes yet.</p>
        )}
        {submissionsError && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                {submissionsError}
            </div>
        )}
        {submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.filter(Boolean).map(sub => (
              <div key={sub._id} className="bg-secondary p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Display Cover Image if available */}
                {sub.coverImage && (
                    <Image 
                        src={sub.coverImage} 
                        alt={`Cover Image for ${sub.title}`}
                        width={80} 
                        height={45} // Maintain 16:9 aspect ratio
                        className="rounded object-cover hidden md:block"
                    />
                )}
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{sub.title}</h3>
                  <p className="text-sm text-primary font-mono">{sub.code}</p>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">{sub.description}</p>
                  {sub.category && <span className="text-xs text-white/50 mr-2 capitalize">Category: {sub.category.replace('_',' ')}</span>}
                  {sub.difficulty && <span className="text-xs text-white/50 mr-2 capitalize">Difficulty: {sub.difficulty}</span>}
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                  <StatusBadge status={sub.status} isFraudulent={sub.isFraudulent} />
                  <p className="text-xs text-white/50 whitespace-nowrap">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                  <button 
                    onClick={() => handleEditClick(sub)}
                    className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"
                  >
                    <FaPencilAlt /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(sub._id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 