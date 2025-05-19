'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaPlus, FaSearch, FaSpinner, FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';
import Link from 'next/link';
import WallpaperList from '@/app/components/admin/WallpaperList';
import WallpaperPreviewModal from '@/app/components/admin/WallpaperPreviewModal';
import { WallpaperEditForm } from '@/app/components/admin/WallpaperEditForm';
import type { Wallpaper } from '@/types/wallpaper';
// Dnd Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface MediaAsset {
  _id: string;
  gridfs_id_original?: string;
  gridfs_id_edited?: string;
  gridfs_id_compressed?: string;
}

export default function AdminWallpapersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const categories = ['all', 'Free Fire', 'Characters', 'Weapons', 'Elite Pass', 'Maps'];

  // Dnd Sensors Setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Wrap fetchWallpapers in useCallback to prevent unnecessary re-renders when passed as prop
  const fetchWallpapers = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) {
      setLoading(true); // Use main loading state for initial/page loads
    } else {
      setRefreshing(true); // Use separate refreshing state for button click
    }
    setError(null);
    // Use different toast messages based on context
    const toastId = toast.loading(isManualRefresh ? 'Refreshing list...' : 'Loading wallpapers...'); 

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== 'all' && { category: selectedCategory })
      });
      
      const response = await fetch(`/api/admin/wallpapers?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      let errorMessage = 'Failed to load wallpapers'; // Default error
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/admin/login');
          errorMessage = 'Session expired or unauthorized. Please log in.';
        }
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || `Error ${response.status}`; 
        } catch (e) { /* Ignore if body isn't JSON */ }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (currentPage === 1) {
        setWallpapers(data.wallpapers || []);
      } else {
        setWallpapers(prev => [...prev, ...data.wallpapers]);
      }
      setTotalPages(data.totalPages || 1);
      setCurrentPage(currentPage);
      toast.success('Wallpapers loaded', { id: toastId });

    } catch (error) {
      console.error('Error fetching wallpapers:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(message); // Set error state for UI display
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false); // Always set main loading false
      setRefreshing(false); // Always set refreshing false
      setLoadingMore(false);
    }
  }, [currentPage, searchTerm, selectedCategory, router, status]);

  // Effect to fetch data on load and when relevant states change
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        router.push('/');
        toast.error('Admin access required');
        return;
      }
      // setLoading(true); // setLoading is handled within fetchWallpapers now
      fetchWallpapers(false); // Explicitly false for initial load
    }
    // Exclude fetchWallpapers intentionally
  }, [status, session, router, currentPage, searchTerm, selectedCategory]); 

  // Dnd Drag End Handler (Keep as is)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = wallpapers.findIndex((item) => item._id === active.id);
      const newIndex = wallpapers.findIndex((item) => item._id === over.id);
      const originalWallpapers = [...wallpapers]; // Store original order for potential revert
      const reorderedWallpapers = arrayMove(wallpapers, oldIndex, newIndex);
      setWallpapers(reorderedWallpapers); // Optimistic update
      const orderedIds = reorderedWallpapers.map(w => w._id);

      try {
        const response = await fetch('/api/admin/wallpapers/reorder', { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ orderedIds }),
        });

        let errorMessage = 'Failed to save new order';
        if (!response.ok) {
          try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
          } catch (e) { /* Ignore */ }
          throw new Error(errorMessage);
        }
        toast.success('Wallpaper order saved.');

      } catch (error) {
        console.error("Error saving wallpaper order:", error);
        setWallpapers(originalWallpapers); // Revert optimistic update
        toast.error(`Error saving order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Delete Handler - Improved Error Message & Fixed URL
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wallpaper?')) return;
    const toastId = toast.loading('Deleting wallpaper...');
    try {
      // FIX: Use path parameter instead of query parameter for DELETE
      const response = await fetch(`/api/admin/wallpapers/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }, // Header might not be strictly necessary for DELETE with no body
        credentials: 'include',
      });

      let errorMessage = 'Failed to delete wallpaper';
      if (!response.ok) {
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) { /* Ignore if response body is not JSON */ }
        throw new Error(errorMessage);
      }

      toast.success('Wallpaper deleted successfully', { id: toastId });
      fetchWallpapers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting wallpaper:', error);
      toast.error(error instanceof Error ? error.message : 'Unknown error', { id: toastId });
    }
  };

  // Edit Handler (Keep as is)
  const handleEdit = (id: string) => {
    router.push(`/admin/wallpapers/${id}/edit`);
  };

  // Effect to prepare modal props when previewWallpaper changes
  useEffect(() => {
    if (!previewWallpaper) {
      setSelectedWallpaper(null);
      return;
    }

    // Logic moved from render phase to effect
    let displayImageUrl = '';
    let preparedProps = null;

    if (previewWallpaper.mediaAssetId && typeof previewWallpaper.mediaAssetId === 'object') {
      const mediaAsset = previewWallpaper.mediaAssetId as any; 
      const gridfsId = mediaAsset.gridfs_id_original || mediaAsset.gridfs_id_edited;
      
      if (gridfsId) {
        displayImageUrl = `/api/media/${gridfsId}?type=image`;
      } else {
        const errorMsg = `[AdminPage] Preview error: No original/edited GridFS ID found in mediaAssetId for ${previewWallpaper._id}`;
        console.error(errorMsg);
        // Call toast here - safe inside useEffect
        toast.error("Cannot display preview: Image ID missing in data."); 
      }
    } else {
        displayImageUrl = previewWallpaper.imageUrl || previewWallpaper.originalImageUrl || '';
        if (!displayImageUrl) {
             const errorMsg = `[AdminPage] Preview error: No mediaAssetId and no direct imageUrl/originalImageUrl for ${previewWallpaper._id}`;
             console.error(errorMsg);
             // Call toast here - safe inside useEffect
             toast.error("Cannot display preview: Image URL missing in data."); 
        }
    }

    if (displayImageUrl) {
        preparedProps = {
          ...previewWallpaper,
          imageUrl: displayImageUrl, 
          // Keep necessary fallbacks for type safety
          description: previewWallpaper.description || '', 
          thumbnailUrl: previewWallpaper.thumbnailUrl || displayImageUrl, 
          originalImageUrl: previewWallpaper.originalImageUrl || displayImageUrl, 
          resolution: previewWallpaper.resolution || '' 
          // Add other fallbacks if needed
        };
    }
    
    // Set the state that controls modal rendering
    setSelectedWallpaper(preparedProps); 

  }, [previewWallpaper]); // Dependency: run when previewWallpaper changes

  // Preview Handlers (Keep as is)
  const handlePreview = (wallpaper: Wallpaper) => {
    setSelectedWallpaper(wallpaper);
    setShowPreviewModal(true);
  };
  const handleClosePreview = () => {
    setSelectedWallpaper(null);
    setShowPreviewModal(false);
  };

  // Pagination Handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      setLoadingMore(true);
      fetchWallpapers(true);
    }
  };

  const handleEditSuccess = (updatedWallpaper: Wallpaper) => {
    // Update the wallpaper in the list
    setWallpapers(wallpapers.map(w => w._id === updatedWallpaper._id ? updatedWallpaper : w));
    setSelectedWallpaper(null);
  };

  // --- Render Logic ---
  return (
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6 pb-4 border-b border-gray-700">
        <h1 className="text-xl sm:text-2xl font-bold text-white font-orbitron">Manage Wallpapers</h1>
        <div className="flex items-center gap-3">
          {/* Refresh Button */} 
          <button 
            onClick={() => fetchWallpapers(true)} // Pass true for manual refresh
            disabled={loading || refreshing} // Disable if initial load or refreshing
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-secondary text-white rounded-lg border border-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Refresh List"
          >
            {refreshing ? <FaSpinner className="animate-spin"/> : <FaSyncAlt />} 
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {/* Add New Button */}
          <Link 
            href="/admin/wallpapers/new"
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-dark rounded-lg hover:bg-primary/80 text-sm sm:text-base font-medium transition-colors"
          >
            <FaPlus />
            <span>Add New</span>
          </Link>
        </div>
      </div>

      {/* Filters */} 
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 p-4 bg-secondary rounded-lg border border-gray-700">
        {/* Search Input */}
        <div className="relative flex-grow">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title..."
            className="w-full bg-dark text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
          />
        </div>
        {/* Category Select */}
        <div className="flex-shrink-0">
           <select 
              className="w-full sm:w-auto bg-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base appearance-none"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1); // Reset page on category change
              }}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
        </div>
      </div>

      {/* Main Content Area: Loading, Error, or List */}
      <div className={`bg-secondary rounded-lg p-4 md:p-6 border border-gray-700 relative ${loading && 'min-h-[300px]'}`}> 
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-secondary/80 backdrop-blur-sm z-30">
            <FaSpinner className="animate-spin text-primary text-3xl" />
            <span className="ml-3 text-gray-300">Loading wallpapers...</span>
          </div>
        )}
        {/* Error display remains the same */}
        {!loading && error ? (
          <div className="flex flex-col justify-center items-center py-10 text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mb-3" />
            <p className="text-red-400 font-medium mb-2">Error loading data</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchWallpapers(false)} // Error retry acts like initial load
              className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        // Render list only if not initial loading and no error
        ) : !loading && !error ? (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={wallpapers.map(w => w._id)} 
              strategy={verticalListSortingStrategy}
            >
              <WallpaperList
                wallpapers={wallpapers}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPreview={handlePreview}
                onListRefresh={() => fetchWallpapers(true)} // Refresh button in list also calls fetch
              />
            </SortableContext>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
                <button 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || refreshing}
                  className="px-3 py-1 sm:px-4 sm:py-1.5 text-sm bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || refreshing}
                  className="px-3 py-1 sm:px-4 sm:py-1.5 text-sm bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </DndContext>
        ) : null } {/* Fallback case */} 
      </div> 

      {/* Preview Modal - Render based on modalProps state */}
      {showPreviewModal && selectedWallpaper && (
        <WallpaperPreviewModal 
          wallpaper={selectedWallpaper}
          onClose={handleClosePreview}
        />
      )}

      {showEditForm && selectedWallpaper && (
        <WallpaperEditForm 
          wallpaper={selectedWallpaper} 
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {currentPage < totalPages && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-primary text-dark rounded hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <FaSpinner className="animate-spin" /> Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
} 