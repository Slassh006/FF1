import React, { useCallback, useRef, useState } from 'react';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FileType, UploadResult, UploadError } from '@/app/types/upload';
import { useFileUpload } from '@/app/hooks/useFileUpload';

interface FileUploadProps {
  fileType: FileType;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: UploadError) => void;
  showPreview?: boolean;
  className?: string;
  accept?: string;
  maxSize?: number;
  showToast?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function FileUpload({
  fileType,
  onUploadComplete,
  onUploadError,
  showPreview = true,
  className = '',
  accept,
  maxSize,
  showToast = true,
  label,
  placeholder = 'Drag & drop or click to upload',
  required = false
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUploading, progress, uploadFile, reset } = useFileUpload({
    fileType,
    onSuccess: (result) => {
      if (showPreview && result.url) {
        setPreview(result.url);
      }
      onUploadComplete?.(result);
    },
    onError: onUploadError,
    showToast
  });

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
      if (maxSize && file.size > maxSize) {
        toast.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }
      await uploadFile(file);
    }
  }, [maxSize, uploadFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (maxSize && file.size > maxSize) {
        toast.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }
      await uploadFile(file);
    }
  }, [maxSize, uploadFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-primary bg-primary/10' : 'border-gray-700 hover:border-primary/50'}
          ${preview ? 'border-primary/50' : ''}
          ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept={accept}
          disabled={isUploading}
        />
        
        {preview ? (
          <div className="relative w-full h-48">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="text-center text-gray-400">
            {isUploading ? (
              <div className="space-y-2">
                <FaSpinner className="mx-auto h-8 w-8 animate-spin" />
                <p>Uploading... {progress}%</p>
              </div>
            ) : (
              <>
                <FaUpload className="mx-auto h-8 w-8 mb-2" />
                <p>{placeholder}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 