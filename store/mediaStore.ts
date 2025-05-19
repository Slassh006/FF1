import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MediaState, MediaActions, MediaItem, MediaFilters, MediaPagination } from '@/types/media'; // Adjust path
import toast from 'react-hot-toast';
import axios from 'axios'; // Or use fetch

// Define a general API response type
interface ApiResponse<T> {
    success: boolean;
    media?: T; // Make media optional for error cases
    pagination?: MediaPagination; // For list responses
    error?: string;
    message?: string; // For delete responses
}

// Define specific response types
type MediaUploadResponse = ApiResponse<MediaItem>;
type MediaUpdateResponse = ApiResponse<MediaItem>;
type MediaListResponse = ApiResponse<MediaItem[]>; // Media is an array here
type MediaDeleteResponse = ApiResponse<never>; // No media data on delete success

const API_BASE = '/api/admin/media';

// Helper to build query string
const buildQueryString = (filters: MediaFilters): string => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
        }
    });
    return params.toString();
};

export const useMediaStore = create<MediaState & MediaActions>()(
    devtools(
        (set, get) => ({
            // Initial State
            mediaItems: [],
            pagination: null,
            filters: {
                page: 1,
                limit: 12,
                type: '',
                search: '',
                sortBy: 'uploadDate',
                sortOrder: 'desc',
            },
            isLoading: false,
            error: null,
            selectedItem: null,
            isModalOpen: false,
            modalMode: 'preview',
            uploadQueue: [],
            uploadProgress: {},

            // Actions
            setFilters: (newFilters: Partial<MediaFilters>) => {
                set((state) => ({
                    filters: { ...state.filters, ...newFilters, page: 1 }, // Reset page on filter change
                    error: null, // Clear previous errors
                }));
                // Fetch data with new filters immediately
                 get().fetchMedia();
            },

            fetchMedia: async (newFilters?: Partial<MediaFilters>) => {
                 const currentFilters = { ...get().filters, ...newFilters };
                 set({ isLoading: true, error: null }); // Start loading, clear previous errors
                 try {
                    const queryString = buildQueryString(currentFilters);
                    // Use MediaListResponse type
                    const response = await axios.get<MediaListResponse>(`${API_BASE}/list?${queryString}`);

                    if (response.data.success && response.data.media) {
                        set((state) => ({
                            // Check if it's a pagination call (page > 1)
                            mediaItems: currentFilters.page && currentFilters.page > 1
                                        ? [...state.mediaItems, ...(response.data.media || [])] // Ensure media exists
                                        : (response.data.media || []), // Ensure media exists
                            pagination: response.data.pagination || null,
                            filters: currentFilters, // Update filters state
                            isLoading: false,
                        }));
                    } else {
                        // Throw error message from API response or a default
                        throw new Error(response.data.error || 'Failed to fetch media from API');
                    }
                } catch (error: any) {
                     console.error("Error fetching media:", error);
                     const message = error.message || 'Failed to fetch media'; // Get message from thrown Error
                     set({ error: message, isLoading: false, mediaItems: [], pagination: null }); // Clear data on error
                     toast.error(`Error: ${message}`);
                }
            },

            addFilesToUpload: (files: File[]) => {
                set((state) => ({
                     // Filter out files already in the queue? Or allow duplicates?
                     // Let's prevent duplicates for simplicity here:
                     uploadQueue: [
                        ...state.uploadQueue,
                        ...files.filter(newFile =>
                             !state.uploadQueue.some(existingFile =>
                                existingFile.name === newFile.name && existingFile.size === newFile.size
                             )
                        )
                     ],
                }));
                // Automatically start processing if not already uploading?
                // get().processUploadQueue(); // Or trigger via UI button
            },

            updateUploadProgress: (fileName, progress) => {
                set((state) => ({
                    uploadProgress: { ...state.uploadProgress, [fileName]: progress }
                }));
            },

            removeFileFromUpload: (fileName) => {
                 set((state) => ({
                    uploadQueue: state.uploadQueue.filter(file => file.name !== fileName),
                    uploadProgress: Object.fromEntries(Object.entries(state.uploadProgress).filter(([key]) => key !== fileName)),
                }));
            },

            processUploadQueue: async () => {
                 const queue = get().uploadQueue;
                 if (queue.length === 0) return;

                 // Process one file at a time for simplicity, could be parallelized
                 const fileToUpload = queue[0];
                 const fileName = fileToUpload.name;

                 set((state) => ({
                    // Keep track of global loading state? Or per-file?
                    isLoading: true, // Maybe use a separate uploadLoading state
                    uploadProgress: { ...state.uploadProgress, [fileName]: 0 }
                 }));

                 const formData = new FormData();
                 formData.append('file', fileToUpload);
                 // Append caption/altText if collected before upload
                 // formData.append('caption', 'Initial Caption');

                 try {
                    // Use MediaUploadResponse type
                    const response = await axios.post<MediaUploadResponse>(`${API_BASE}/upload`, formData, {
                        onUploadProgress: (progressEvent) => {
                             const percentCompleted = progressEvent.total
                                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                                : 0; // Handle case where total is not known
                             get().updateUploadProgress(fileName, percentCompleted);
                         }
                     });

                     if (response.data.success && response.data.media) {
                        const newMediaItem = response.data.media;
                         toast.success(`Uploaded: ${fileName}`);
                         set((state) => ({
                             // Optimistic UI: Add to list immediately (or after fetch?)
                             // A full fetch might be better to maintain sorting/pagination
                             // mediaItems: [newMediaItem, ...state.mediaItems],

                             // Remove from queue and progress map
                             uploadQueue: state.uploadQueue.slice(1),
                             uploadProgress: Object.fromEntries(Object.entries(state.uploadProgress).filter(([key]) => key !== fileName)),
                         }));
                         // Refresh the list to include the new item correctly sorted/paginated
                         get().fetchMedia({ page: 1 }); // Refetch first page to see new item
                     } else {
                         // Throw the specific error message from the API response
                         throw new Error(response.data.error || 'Upload failed');
                     }

                 } catch (error: any) {
                    console.error(`Error uploading ${fileName}:`, error);
                    // Now catch block can likely just use error.message
                    const message = error.message || `Failed to upload ${fileName}`; // Simplified
                    toast.error(`Upload Error: ${message}`);
                    set((state) => ({
                        error: `Upload failed for ${fileName}. ${message}`,
                        // Remove from progress, keep in queue to retry? Or remove? Let's remove.
                        uploadQueue: state.uploadQueue.filter(f => f.name !== fileName), // Remove from queue on error
                        uploadProgress: Object.fromEntries(Object.entries(state.uploadProgress).filter(([key]) => key !== fileName)),
                    }));
                 } finally {
                     set({ isLoading: false }); // Reset global loading flag
                     // If there are more files, continue processing
                     if(get().uploadQueue.length > 0) {
                         get().processUploadQueue();
                     }
                 }
            },

            updateMedia: async (slug, data) => {
                 const originalItems = get().mediaItems;
                 // Optimistic update
                 set((state) => ({
                    mediaItems: state.mediaItems.map(item =>
                        item.slug === slug ? { ...item, ...data } : item
                    ),
                    isLoading: true, // Indicate loading during update
                }));
                 toast.loading(`Updating ${data.filename || 'media'}...`, { id: `update-${slug}` });

                 try {
                     // Use MediaUpdateResponse type
                     const response = await axios.patch<MediaUpdateResponse>(`${API_BASE}/${slug}`, data);
                     if (response.data.success && response.data.media) {
                        toast.success(`Updated ${response.data.media.filename}`, { id: `update-${slug}` });
                        set((state) => ({
                            // Replace with the actual response data to ensure consistency
                            mediaItems: state.mediaItems.map(item =>
                                item.slug === slug ? response.data.media! : item // Use non-null assertion
                            ),
                            isLoading: false,
                            selectedItem: state.selectedItem?.slug === slug ? response.data.media : state.selectedItem, // Update selected item if it's the one being edited
                            isModalOpen: false, // Close modal on successful update
                         }));
                     } else {
                         // Throw the specific error message from the API response
                         throw new Error(response.data.error || 'Update failed');
                     }
                 } catch (error: any) {
                     console.error(`Error updating media ${slug}:`, error);
                     // Now catch block can likely just use error.message
                     const message = error.message || 'Failed to update media'; // Simplified
                     toast.error(`Update Error: ${message}`, { id: `update-${slug}` });
                     // Revert optimistic update
                     set({ mediaItems: originalItems, isLoading: false });
                 }
            },

            deleteMedia: async (slug) => {
                const itemToDelete = get().mediaItems.find(item => item.slug === slug);
                if (!itemToDelete) return;

                 if (!confirm(`Are you sure you want to delete "${itemToDelete.filename}"? This action cannot be undone.`)) {
                     return;
                 }

                 const originalItems = get().mediaItems;
                 // Optimistic update
                 set((state) => ({
                    mediaItems: state.mediaItems.filter(item => item.slug !== slug),
                    isLoading: true,
                }));
                toast.loading(`Deleting ${itemToDelete.filename}...`, { id: `delete-${slug}` });

                try {
                     // Use MediaDeleteResponse type
                     const response = await axios.delete<MediaDeleteResponse>(`${API_BASE}/${slug}`);
                     if (response.data.success) {
                         toast.success(`Deleted ${itemToDelete.filename}`, { id: `delete-${slug}` });
                         set({ isLoading: false }); // Optimistic update already removed it
                         // Optionally, refetch to ensure pagination/total count is correct if needed
                         // get().fetchMedia(get().filters);
                     } else {
                         // Throw the specific error message from the API response
                         throw new Error(response.data.message || 'Delete failed');
                     }
                 } catch (error: any) {
                     console.error(`Error deleting media ${slug}:`, error);
                    // Now catch block can likely just use error.message
                     const message = error.message || 'Failed to delete media'; // Simplified
                     toast.error(`Delete Error: ${message}`, { id: `delete-${slug}` });
                     // Revert optimistic update
                     set({ mediaItems: originalItems, isLoading: false });
                 }
            },

            openModal: (item, mode) => {
                set({ selectedItem: item, modalMode: mode, isModalOpen: true });
            },

            closeModal: () => {
                set({ isModalOpen: false, selectedItem: null });
            },

            setSelectedItem: (item: MediaItem | null) => {
                set({ selectedItem: item });
            },
        }),
        { name: "MediaStore" } // Name for Redux DevTools
    )
); 