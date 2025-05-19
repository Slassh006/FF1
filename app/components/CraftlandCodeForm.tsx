import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Listbox, Transition } from '@headlessui/react';
import { FaCheck, FaChevronDown, FaTimes, FaUpload, FaSave } from 'react-icons/fa';
import { Fragment } from 'react';
import LoadingSpinner from './LoadingSpinner';
import BaseCraftlandCodeForm from './BaseCraftlandCodeForm';

// Define Option type
interface SelectOption {
  value: string;
  label: string;
}

// Interface for form props
interface CraftlandCodeFormProps {
  onSubmit?: (data: any) => void;
}

// Define options as objects
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
const findOption = (options: SelectOption[], value: string): SelectOption | null => {
  return options.find(opt => opt.value === value) || null;
};

// Default options
const defaultCategory = categoryOptions[0];
const defaultRegion = findOption(regionOptions, 'IN') || regionOptions[0];
const defaultDifficulty = findOption(difficultyOptions, 'medium');

// Update FormData state interface
interface FormDataState {
  code: string;
  title: string;
  description: string;
  category: SelectOption | null;
  region: SelectOption | null;
  difficulty: SelectOption | null;
  videoUrl: string;
  features?: string[];
}

// Simplified form specifically for NEW submissions by users
export default function CraftlandCodeForm() {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await fetch('/api/craftland-codes', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit code. Please check your input.');
      }

      toast.success('Code submitted successfully! It will be reviewed.');
        router.push('/craftland-codes');
    } catch (error: any) {
      console.error("Submission error:", error);
      throw error; // Let the base form handle the error display
    }
  };

  return (
    <BaseCraftlandCodeForm
      onSubmit={handleSubmit}
      submitButtonText="Submit Code"
    />
  );
} 