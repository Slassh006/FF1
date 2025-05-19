import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FileType, UploadResult, UploadError } from '../types/upload';
import { uploadService } from '../lib/uploadService';

interface UseFileUploadOptions {
  fileType: FileType;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: UploadError) => void;
  showToast?: boolean;
}

interface UseFileUploadResult {
  isUploading: boolean;
  progress: number;
  uploadFile: (file: File) => Promise<UploadResult | null>;
  reset: () => void;
}

export function useFileUpload({
  fileType,
  onSuccess,
  onError,
  showToast = true
}: UseFileUploadOptions): UseFileUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    try {
      setIsUploading(true);
      setProgress(0);

      // Simulate progress (since we don't have actual upload progress from GridFS)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadService.upload(file, fileType);

      clearInterval(progressInterval);
      setProgress(100);

      if (showToast) {
        toast.success('File uploaded successfully');
      }

      onSuccess?.(result);
      return result;
    } catch (error) {
      const uploadError = error as UploadError;
      
      if (showToast) {
        toast.error(uploadError.message || 'Failed to upload file');
      }

      onError?.(uploadError);
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [fileType, onSuccess, onError, showToast]);

  return {
    isUploading,
    progress,
    uploadFile,
    reset
  };
} 