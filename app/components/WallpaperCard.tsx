import Image from 'next/image';
import { FaDownload, FaTimes, FaHeart, FaEye, FaBookmark } from 'react-icons/fa';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface WallpaperCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  downloadUrl: string;
  category: string;
  tags: string[];
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  isHD: boolean;
  isNew: boolean;
  isTrending: boolean;
  isLiked?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  onDownload?: () => void;
}

export default function WallpaperCard({
  id,
  title,
  description,
  imageUrl,
  thumbnailUrl,
  downloadUrl,
  category,
  tags,
  viewCount = 0,
  downloadCount = 0,
  likeCount = 0,
  isHD = false,
  isNew = false,
  isTrending = false,
  isLiked = false,
  onClose,
  isModal = false,
  onDownload
}: WallpaperCardProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikes, setLocalLikes] = useState(likeCount);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      toast.error('Please login to download wallpapers');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/wallpapers/${id}/download`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to download wallpaper');
      
      // Create a temporary link to trigger the download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Wallpaper downloaded successfully');
      if (onDownload) onDownload();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download wallpaper');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      toast.error('Please login to like wallpapers');
      return;
    }
    try {
      const response = await fetch(`/api/wallpapers/${id}/like`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to update like');
      setLocalIsLiked(!localIsLiked);
      setLocalLikes(prev => localIsLiked ? prev - 1 : prev + 1);
      toast.success(localIsLiked ? 'Like removed' : 'Wallpaper liked');
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      toast.error('Please login to bookmark wallpapers');
      return;
    }
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Bookmark removed' : 'Wallpaper bookmarked');
  };

  return (
    <div className="relative group">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-primary/20 shadow-lg shadow-primary/5">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            {/* Top section */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1 font-orbitron">{title}</h3>
                <p className="text-sm text-white/80 line-clamp-2 font-rajdhani">{description}</p>
              </div>
              {isModal && onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              )}
            </div>
            
            {/* Bottom section */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className="p-2 rounded-lg transition-colors text-white/70 hover:text-primary"
                >
                  <FaHeart className={`w-5 h-5 ${localIsLiked ? 'text-primary' : ''}`} />
                  <span className="text-sm ml-1 font-rajdhani">{localLikes}</span>
                </button>
                <div className="flex items-center text-white/70">
                  <FaEye className="w-5 h-5 mr-1" />
                  <span className="text-sm font-rajdhani">{viewCount}</span>
                </div>
                <button
                  onClick={handleBookmark}
                  className="p-2 rounded-lg transition-colors text-white/70 hover:text-primary"
                >
                  <FaBookmark className={`w-5 h-5 ${isBookmarked ? 'text-primary' : ''}`} />
                </button>
              </div>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/90 transition-colors flex items-center font-orbitron text-sm"
              >
                <FaDownload className="mr-1" />
                {loading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-2">
        {isHD && (
          <span className="px-2 py-1 bg-primary text-dark text-xs font-medium rounded font-orbitron shadow-lg shadow-primary/30">
            HD
          </span>
        )}
        {isNew && (
          <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded font-orbitron shadow-lg shadow-green-500/30">
            NEW
          </span>
        )}
        {isTrending && (
          <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded font-orbitron shadow-lg shadow-orange-500/30">
            TRENDING
          </span>
        )}
      </div>
      
      {/* Category badge */}
      <div className="absolute top-2 right-2">
        <span className="px-2 py-1 bg-dark/70 text-primary text-xs font-medium rounded font-orbitron border border-primary/30">
          {category}
        </span>
      </div>
    </div>
  );
} 