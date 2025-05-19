'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ICraftlandCode } from '@/app/models/CraftlandCode'; // Import the interface
import { Listbox, Transition } from '@headlessui/react'; // Import Listbox
import { FaCheck, FaChevronDown } from 'react-icons/fa'; // Import Icons
import { Fragment } from 'react'; // Import Fragment
import BaseCraftlandCodeForm from './BaseCraftlandCodeForm';
import LoadingSpinner from './LoadingSpinner';

// Define possible statuses matching the schema
const STATUSES: Array<ICraftlandCode['status']> = ['pending', 'approved', 'rejected'];

// Re-use constants where applicable
const CATEGORIES = [
  'Battle Arena', 'Survival', 'Parkour', 'Defense', 'Racing', 'Adventure', 'Puzzle', 'Other'
];
const REGIONS = [
  'IN', 'ID', 'BR', 'MENA', 'US', 'EU', 'TH', 'VN', 'TW', 'RU', 'SA', 'NA', 'BD', 'PK', 'SG', 'MY', 'GLOBAL'
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Define the expected shape of initialData more accurately
type InitialCraftlandCodeData = Partial<Omit<ICraftlandCode, 'upvotes' | 'downvotes' | 'likes' | 'creator' | 'submittedBy' | 'category' | 'region' | 'difficulty' | 'status'>> & {
    _id: string;
    tags?: string[];
    category?: string;
    region?: string;
    difficulty?: string;
    status?: ICraftlandCode['status'];
};

// Define Option type
interface SelectOption {
  value: string;
  label: string;
}

// Define options as objects (including statusOptions at the top)
const statusOptions: SelectOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
const categoryOptions: SelectOption[] = [
  { value: 'Battle Arena', label: 'Battle Arena' }, { value: 'Survival', label: 'Survival' },
  { value: 'Parkour', label: 'Parkour' }, { value: 'Defense', label: 'Defense' },
  { value: 'Racing', label: 'Racing' }, { value: 'Adventure', label: 'Adventure' },
  { value: 'Puzzle', label: 'Puzzle' }, { value: 'Other', label: 'Other' },
];
const regionOptions: SelectOption[] = [
  { value: 'IN', label: 'India (IN)' }, { value: 'ID', label: 'Indonesia (ID)' },
  { value: 'BR', label: 'Brazil (BR)' }, { value: 'MENA', label: 'MENA' },
  { value: 'US', label: 'USA (US)' }, { value: 'EU', label: 'Europe (EU)' },
  { value: 'TH', label: 'Thailand (TH)' }, { value: 'VN', label: 'Vietnam (VN)' },
  { value: 'TW', label: 'Taiwan (TW)' }, { value: 'RU', label: 'Russia (RU)' },
  { value: 'SA', label: 'South America (SA)' }, { value: 'NA', label: 'North America (NA)' },
  { value: 'BD', label: 'Bangladesh (BD)' }, { value: 'PK', label: 'Pakistan (PK)' },
  { value: 'SG', label: 'Singapore (SG)' }, { value: 'MY', label: 'Malaysia (MY)' },
  { value: 'GLOBAL', label: 'Global' },
];
const difficultyOptions: SelectOption[] = [
  { value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

// Helper to find option object by value
const findOption = (options: SelectOption[], value: string | undefined | null): SelectOption | null => {
  if (value === null || value === undefined) return null;
  return options.find(opt => opt.value === value) || null;
};

// Update FormData state interface
interface FormDataState {
    code: string;
    title: string;
    description: string;
    category: SelectOption | null;
    region: SelectOption | null;
    difficulty: SelectOption | null;
    status: SelectOption | null;
    isVerified: boolean;
    author: string;
    videoUrl: string;
    isActive: boolean;
}

interface AdminCraftlandCodeFormProps {
  initialData: InitialCraftlandCodeData;
  onSubmitSuccess?: (updatedData: any) => void;
}

// Helper function to get default options (ensure statusOptions is used)
const getDefaultOptions = (initialData: InitialCraftlandCodeData) => ({
  category: findOption(categoryOptions, initialData.category) || categoryOptions[0],
  region: findOption(regionOptions, initialData.region) || regionOptions.find(o => o.value === 'GLOBAL') || regionOptions[0],
  difficulty: findOption(difficultyOptions, initialData.difficulty) || difficultyOptions.find(o => o.value === 'medium') || difficultyOptions[0],
  status: findOption(statusOptions, initialData.status) || statusOptions[0],
});

export default function AdminCraftlandCodeForm({ initialData, onSubmitSuccess }: AdminCraftlandCodeFormProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Initialize form data with defaults or initial values
  const [formData, setFormData] = useState<FormDataState>({
    code: initialData?.code || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: findOption(categoryOptions, initialData?.category) || categoryOptions[0],
    region: findOption(regionOptions, initialData?.region) || regionOptions.find(o => o.value === 'GLOBAL') || regionOptions[0],
    difficulty: findOption(difficultyOptions, initialData?.difficulty) || difficultyOptions.find(o => o.value === 'medium') || difficultyOptions[0],
    status: findOption(statusOptions, initialData?.status) || statusOptions[0],
    isVerified: initialData?.isVerified || false,
    author: initialData?.author || '',
    videoUrl: initialData?.videoUrl || '',
    isActive: initialData?.isActive ?? false
  });

  const handleSubmit = async (formData: FormData, isActive?: boolean) => {
    const toastId = toast.loading(initialData?._id ? 'Updating code...' : 'Submitting code...');
    try {
      // Add admin-specific fields
      formData.append('status', formData.get('status') as string || 'pending');
      formData.append('isVerified', formData.get('isVerified') as string || 'false');
      formData.append('author', formData.get('author') as string || 'Admin');
      formData.append('isActive', isActive ? 'true' : 'false');

      const response = await fetch('/api/admin/craftland-codes', { 
        method: initialData?._id ? 'PUT' : 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to submit code';
        try {
          errorMessage = data.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success(`Code ${initialData?._id ? 'updated' : 'submitted'} successfully!`, { id: toastId });
      
      if (onSubmitSuccess) {
        onSubmitSuccess(data.craftlandCode);
      } else {
        router.push('/admin/craftland-codes');
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      const errorMessage = error.message || 'An unexpected error occurred';
      toast.error(errorMessage, { id: toastId });
      throw error;
    }
  };

  return (
    <BaseCraftlandCodeForm
      initialData={formData}
      onSubmit={handleSubmit}
      submitButtonText={initialData?._id ? 'Update Code' : 'Submit Code'}
      isAdmin={true}
    />
  );
} 