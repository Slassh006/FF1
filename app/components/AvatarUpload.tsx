'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaCamera, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

interface AvatarUploadProps {
  currentAvatar: string | undefined | null;
  userName: string;
  onAvatarUpdate: (newAvatar: string) => void;
  avatarLastUpdatedAt?: string | Date | null;
}

const MIN_UPDATE_INTERVAL_DAYS = 7;

const generateDefaultAvatarUrl = (name: string) => {
  const encodedName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0D8ABC&color=fff&size=128`;
};

export default function AvatarUpload({ currentAvatar, userName, onAvatarUpdate, avatarLastUpdatedAt }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
    if (!currentAvatar) {
        setPreviewUrl(null);
    }
  }, [currentAvatar]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (avatarLastUpdatedAt) {
      const lastUpdateDate = new Date(avatarLastUpdatedAt);
      const now = new Date();
      const timeDiff = now.getTime() - lastUpdateDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      if (daysDiff < MIN_UPDATE_INTERVAL_DAYS) {
        toast.error(`You can change your avatar again in ${Math.ceil(MIN_UPDATE_INTERVAL_DAYS - daysDiff)} days.`);
        return;
      }
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Max 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setImageError(false);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onAvatarUpdate(data.avatarUrl);
        toast.success('Avatar updated successfully');
      } else {
        throw new Error(data.error || 'Failed to upload avatar');
      }
    } catch (error: any) {
      toast.error('Could not update avatar. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const response = await fetch('/api/profile/remove-avatar', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onAvatarUpdate('');
        setPreviewUrl(null);
        setImageError(false);
        toast.success('Avatar removed successfully');
      } else {
        throw new Error(data.error || 'Failed to remove avatar');
      }
    } catch (error: any) {
      toast.error('Could not remove avatar. Please try again.');
    }
  };

  let finalSrc = previewUrl || currentAvatar;
  if (!finalSrc || imageError) {
      finalSrc = generateDefaultAvatarUrl(userName); 
  }

  return (
    <div className="relative group">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-dark border-2 border-primary/20">
        <Image
          key={finalSrc}
          src={finalSrc}
          alt="Profile avatar"
          width={128}
          height={128}
          className="w-full h-full object-cover"
          onError={() => {
            console.log(`Image failed to load: ${previewUrl || currentAvatar}. Falling back to generated default.`);
            if (!imageError) {
                setImageError(true);
            }
          }}
        />
      </div>

      <label
        className={`absolute bottom-0 right-0 p-2 rounded-full bg-primary text-dark cursor-pointer transition-opacity ${
          isUploading ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        <FaCamera className="w-5 h-5" />
      </label>

      {currentAvatar && (
        <button
          onClick={handleRemoveAvatar}
          className="absolute top-0 right-0 p-2 rounded-full bg-red-500 text-white cursor-pointer transition-opacity hover:opacity-80"
          disabled={isUploading}
        >
          <FaTrash className="w-4 h-4" />
        </button>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark/70 rounded-full">
          <LoadingSpinner size="medium" />
        </div>
      )}
    </div>
  );
} 