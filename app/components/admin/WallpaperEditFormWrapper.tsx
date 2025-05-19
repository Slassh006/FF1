'use client';

import dynamic from 'next/dynamic';
import type { Wallpaper } from '@/types/wallpaper';

const WallpaperEditForm = dynamic(
  () => import('./WallpaperEditForm'),
  { ssr: false }
);

interface Props {
  wallpaper: Wallpaper;
  onClose?: () => void;
  onSuccess?: (updatedWallpaper: Wallpaper) => void;
}

export default function WallpaperEditFormWrapper(props: Props) {
  const defaultProps = {
    onClose: () => {},
    onSuccess: () => {},
    ...props
  };
  
  return <WallpaperEditForm {...defaultProps} />;
} 