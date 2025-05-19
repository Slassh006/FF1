export interface Wallpaper {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  originalImageUrl: string;
  resolution: string;
  category: 'Free Fire' | 'Characters' | 'Weapons' | 'Elite Pass' | 'Maps';
  tags: string[];
  downloads: number;
  likes: number;
  viewCount: number;
  isPublished: boolean;
  isHD: boolean;
  isNew: boolean;
  isTrending: boolean;
  contentType: string;
  createdAt: string;
  updatedAt: string;
} 