'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import AdminCraftlandCodeForm from '../../../../components/AdminCraftlandCodeForm';
import { ICraftlandCode } from '@/app/models/CraftlandCode';
import { Document } from 'mongoose';

// Define the type for params
interface EditCraftlandCodeParams {
    id: string;
}

// Define the type for initial data that matches AdminCraftlandCodeForm's requirements
interface InitialCraftlandCodeData {
  _id: string;
  title: string;
  code: string;
  description: string;
  category?: string;
  region?: string;
  difficulty?: string;
  status?: 'pending' | 'approved' | 'rejected';
  author?: string;
  isVerified?: boolean;
  isActive?: boolean;
  videoUrl?: string;
  tags?: string[];
  features?: string[];
  coverImage?: string;
}

// Define the type for the MongoDB document with _id
interface CraftlandCodeDocument extends ICraftlandCode, Document {
  _id: string;
}

const EditCraftlandCodePage = ({ params }: { params: Promise<EditCraftlandCodeParams> }) => {
  const { id } = React.use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialData, setInitialData] = useState<InitialCraftlandCodeData | null>(null);

  // Fetch existing data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.isAdmin) {
        router.push('/');
        toast.error('You need admin access to view this page');
            return; 
        }

      setLoading(true);
      const toastId = toast.loading('Loading craftland code data...');
      
      try {
        const response = await fetch(`/api/admin/craftland-codes/${id}`);
        if (!response.ok) {
          let errorMessage = 'Failed to fetch craftland code data';
          try {
          const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (data.success && data.craftlandCode) {
          const craftlandCode = data.craftlandCode as CraftlandCodeDocument;
          
          // Transform the data to match InitialCraftlandCodeData type
          const transformedData: InitialCraftlandCodeData = {
            _id: craftlandCode._id,
            title: craftlandCode.title,
            code: craftlandCode.code,
            description: craftlandCode.description,
            category: craftlandCode.category,
            region: craftlandCode.region,
            difficulty: craftlandCode.difficulty,
            status: craftlandCode.status,
            author: craftlandCode.author,
            isVerified: craftlandCode.isVerified,
            isActive: craftlandCode.isActive,
            videoUrl: craftlandCode.videoUrl,
            tags: craftlandCode.tags,
            features: craftlandCode.features,
            coverImage: craftlandCode.coverImage
          };
          setInitialData(transformedData);
          toast.success('Data loaded successfully', { id: toastId });
        } else {
          throw new Error('Craftland code data not found');
        }
      } catch (err: any) {
        console.error('Error fetching craftland code:', err);
        const errorMessage = err.message || 'Failed to load data';
        setError(errorMessage);
        toast.error(errorMessage, { id: toastId });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, session, status, router]);

  // Handle successful update
  const handleSubmitSuccess = (updatedData: ICraftlandCode) => {
      toast.success('Craftland code updated successfully');
      router.push('/admin/craftland-codes');
  };

  // Render loading/error states
  if (loading || status === 'loading') {
    return (
        <div className="p-6">
        <div className="flex items-center justify-center h-64">
             <LoadingSpinner size="large" />
          </div>
        </div>
      );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-500">
          No data found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Craftland Code</h1>
      <AdminCraftlandCodeForm
        initialData={initialData}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  );
};

export default EditCraftlandCodePage; 