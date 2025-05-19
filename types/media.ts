// types/media.ts
export interface MediaItem {
  _id: string; // Mongoose ObjectId as string
  slug: string; // Unique identifier (e.g., UUID)
  filename: string; // Original filename
  caption?: string;
  altText?: string;
  uploadDate: string; // ISO Date string
  size: number; // In bytes
  type: string; // MIME type (e.g., 'image/jpeg', 'video/mp4')
  url: string; // URL to access the file (e.g., /api/admin/media/stream/:slug)
  gridFsId: string; // ID from GridFS
  // Add any other relevant fields, e.g., userId if tracking uploads per user
}

export interface MediaPagination {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface MediaFilters {
  page?: number;
  limit?: number;
  type?: 'image' | 'video' | 'document' | 'other' | '';
  search?: string;
  sortBy?: string; // e.g., 'uploadDate'
  sortOrder?: 'asc' | 'desc';
}

export interface MediaState {
  mediaItems: MediaItem[];
  pagination: MediaPagination | null;
  filters: MediaFilters;
  isLoading: boolean;
  error: string | null;
  selectedItem: MediaItem | null;
  isModalOpen: boolean;
  modalMode: 'preview' | 'edit';
  uploadQueue: File[];
  uploadProgress: { [fileName: string]: number }; // Progress per file
}

export interface MediaActions {
  fetchMedia: (newFilters?: Partial<MediaFilters>) => Promise<void>;
  setFilters: (newFilters: Partial<MediaFilters>) => void;
  addFilesToUpload: (files: File[]) => void;
  processUploadQueue: () => Promise<void>;
  updateUploadProgress: (fileName: string, progress: number) => void;
  removeFileFromUpload: (fileName: string) => void;
  updateMedia: (slug: string, data: Partial<Pick<MediaItem, 'filename' | 'caption' | 'altText'>>) => Promise<void>;
  deleteMedia: (slug: string) => Promise<void>;
  openModal: (item: MediaItem, mode: 'preview' | 'edit') => void;
  closeModal: () => void;
  setSelectedItem: (item: MediaItem | null) => void;
} 