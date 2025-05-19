'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSession } from 'next-auth/react';
import { IWallpaper } from '@/app/lib/types';
import { FaSearch, FaFilter, FaSortAmountDown, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import SmartDownloadModal from '../components/SmartDownloadModal';
import WallpaperCard from '@/app/components/gallery/WallpaperCard';

// Define expected shape for modal props
interface SmartDownloadModalWallpaperData {
  _id: string;
  title?: string;
  imageUrl: string; // Need a primary image URL for the modal preview
  originalUrl: string;
  mobileUrl?: string;
}

// Minimal type for MediaAsset if not exported
interface MediaAsset {
  gridfs_id_original?: string;
  gridfs_id_edited?: string;
  gridfs_id_compressed?: string;
}

// Constants for configuration
const CATEGORIES = ['Free Fire', 'Characters', 'Weapons', 'Elite Pass', 'Maps'];
const SORT_OPTIONS = [
  { label: 'Latest', value: 'latest' }, // Note: API uses custom sort, this might be visual only
  { label: 'Most Downloaded', value: 'downloads' },
  { label: 'Most Liked', value: 'likes' },
  { label: 'Trending', value: 'trending' }
];
const ITEMS_PER_PAGE = 20; // Match API limit if possible

// --- Helper Components ---

const WallpaperSkeleton: React.FC = () => (
  <div className="bg-secondary rounded-lg overflow-hidden border border-primary/20 animate-pulse">
    <div className="aspect-video bg-dark/50"></div>
    <div className="p-3">
      <div className="h-4 bg-dark/50 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-dark/50 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between">
        <div className="h-3 bg-dark/50 rounded w-1/4"></div>
        <div className="h-3 bg-dark/50 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

const NoResults: React.FC<{ onClearFilters: () => void, category: string }> = ({ onClearFilters, category }) => (
  <div className="text-center py-10 md:py-12 col-span-full"> {/* Ensure it spans grid columns */}
    <div className="mb-4">
      <img 
        src="/images/empty-gallery.svg" // Keep existing image path
        alt="No wallpapers found" 
        className="w-32 h-32 md:w-48 md:h-48 mx-auto opacity-50"
      />
    </div>
    <h3 className="text-lg md:text-xl font-bold text-white mb-2">
      No Wallpapers Found
    </h3>
    <p className="text-gray-400 mb-4 text-sm md:text-base">
      {category 
        ? `No wallpapers found in the ${category} category.` 
        : 'No wallpapers match your current filters.'}
    </p>
    <button
      onClick={onClearFilters}
      className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80 text-sm md:text-base"
    >
      Clear Filters
    </button>
  </div>
);

// --- Main Gallery Page Component ---

export default function GalleryPage() {
  const { data: session } = useSession(); // Keep session if needed elsewhere

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // Note: API uses custom sort
  const [wallpapers, setWallpapers] = useState<IWallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [modalWallpaperData, setModalWallpaperData] = useState<SmartDownloadModalWallpaperData | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Ref for infinite scroll trigger
  const { ref: intersectionRef, inView } = useInView({ threshold: 0.1 });

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- Data Fetching --- 
  const fetchWallpapers = useCallback(async (pageNum: number, currentFilters: { search: string; category: string; sort: string }) => {
    // Only set loading true when fetching page 1
    if (pageNum === 1) {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: currentFilters.search,
        category: currentFilters.category,
        sort: currentFilters.sort, // Send sort, even if API ignores it for now
      });
      
      const response = await fetch(`/api/wallpapers?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        throw new Error(errorData.error || `Failed to load wallpapers (Status: ${response.status})`);
      }
      
      const data = await response.json();
      
      setWallpapers(prev => pageNum === 1 ? data.wallpapers : [...prev, ...data.wallpapers]);
      setHasMore(data.hasMore);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      toast.error('Failed to load wallpapers');
      console.error("[GalleryPage] Fetch Error:", err);
      setHasMore(false); // Stop loading more on error
    } finally {
      setLoading(false);
    }
  }, []); // Dependencies are handled in the calling useEffects

  // Effect for triggering initial fetch and fetch on filter/sort changes
  useEffect(() => {
    setPage(1); // Reset page to 1 when filters change
    setWallpapers([]); // Clear existing wallpapers
    setHasMore(true); // Assume there might be more
    fetchWallpapers(1, { search: debouncedSearchTerm, category: selectedCategory, sort: sortBy });
  }, [debouncedSearchTerm, selectedCategory, sortBy, fetchWallpapers]);

  // Effect for handling infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading && page > 0) { // Ensure page isn't 0
      const nextPage = page + 1;
      setPage(nextPage);
      fetchWallpapers(nextPage, { search: debouncedSearchTerm, category: selectedCategory, sort: sortBy });
    }
  }, [inView, hasMore, loading, page, debouncedSearchTerm, selectedCategory, sortBy, fetchWallpapers]);


  // --- Event Handlers ---
  const handleWallpaperClick = useCallback((wallpaper: IWallpaper) => {
    // Ensure essential wallpaper data exists
    if (!wallpaper?._id || !wallpaper?.mediaAssetId || typeof wallpaper.mediaAssetId !== 'object') {
      console.error('[GalleryPage] Cannot open modal: Invalid data for wallpaper:', wallpaper?._id);
      toast.error('Could not load wallpaper details.');
      return;
    }

    // --- Construct URLs expected by SmartDownloadModal --- 
    // ASSUMPTION: mediaAssetId contains GridFS IDs for different versions.
    // Adjust this logic if your IWallpaper or MediaAsset structure is different.
    const mediaAsset = wallpaper.mediaAssetId as MediaAsset; 

    // Determine the Original URL (for desktop download)
    // Prioritize 'original', fallback to 'edited'.
    const originalUrl = mediaAsset.gridfs_id_original 
                      ? `/api/media/${mediaAsset.gridfs_id_original}?type=image` 
                      : mediaAsset.gridfs_id_edited 
                      ? `/api/media/${mediaAsset.gridfs_id_edited}?type=image` 
                      : ''; // No suitable original/edited found
                      
    // Determine the Mobile URL (for mobile download button)
    // Prioritize 'compressed', fallback to the determined originalUrl.
    const mobileUrl = mediaAsset.gridfs_id_compressed
                    ? `/api/media/${mediaAsset.gridfs_id_compressed}?type=image`
                    : originalUrl; // Fallback if no compressed version

    // Determine the Image URL for Modal Preview
    // Use the determined originalUrl (original or edited) for the best quality preview.
    // The modal's mobile crop logic will use this imageUrl as its source.
    const imageUrlForPreview = originalUrl;

    // Check if we could determine a usable URL for preview/download
    if (!imageUrlForPreview) { 
        console.error('[GalleryPage] Cannot open modal: No valid base image URL found (original/edited) for wallpaper:', wallpaper._id);
        toast.error('Could not determine wallpaper URL.');
        return;
    }

    // Prepare data matching SmartDownloadModalProps
    const dataForModal: SmartDownloadModalWallpaperData = {
      _id: wallpaper._id,
      title: wallpaper.title,
      imageUrl: imageUrlForPreview, // URL for preview & mobile crop source
      originalUrl: originalUrl || imageUrlForPreview, // Ensure originalUrl isn't empty
      mobileUrl: mobileUrl || imageUrlForPreview, // Ensure mobileUrl isn't empty
    };

    setModalWallpaperData(dataForModal); 
    setShowDownloadModal(true);          
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDownloadModal(false);
    setModalWallpaperData(null); // Clear modal data on close
  }, []);

  const handleCategoryClick = useCallback((category: string) => {
      setSelectedCategory(category);
  }, []);

  const handleClearFilters = useCallback(() => {
      setSearchTerm('');
      setSelectedCategory('');
      setSortBy('latest'); // Reset sort
  }, []);

  // --- Render Logic ---
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-screen flex flex-col">
      {/* Header Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-white font-orbitron mb-6 md:mb-8 text-center">
        Free Fire Wallpapers
      </h1>

      {/* Filter/Search Bar */}
      <div className="bg-secondary rounded-lg p-3 md:p-4 mb-6 md:mb-8 border border-primary/20">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Search Input */}
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 pointer-events-none" />
            <input
              type="text"
              placeholder="Search wallpapers..."
              className="w-full bg-dark text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Category & Sort Selects */}
          <div className="flex-shrink-0 flex flex-wrap items-center justify-start md:justify-end gap-3 md:gap-4">
            <div className="flex items-center flex-grow md:flex-grow-0">
              <FaFilter className="text-white/50 mr-2 hidden sm:inline" />
              <select 
                className="w-full md:w-auto bg-dark text-white px-3 md:px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base appearance-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center flex-grow md:flex-grow-0">
              <FaSortAmountDown className="text-white/50 mr-2 hidden sm:inline" />
              <select 
                className="w-full md:w-auto bg-dark text-white px-3 md:px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base appearance-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Category Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
        <button
          onClick={() => handleCategoryClick('')}
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm transition-all ${
            selectedCategory === '' ? 'bg-primary text-dark' : 'bg-secondary text-white hover:bg-primary/20'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm transition-all ${
              selectedCategory === category ? 'bg-primary text-dark' : 'bg-secondary text-white hover:bg-primary/20'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow">
        {/* Error Display */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchWallpapers(1, { search: debouncedSearchTerm, category: selectedCategory, sort: sortBy })}
              className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Grid or Loading/No Results */} 
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4"> {/* Kept lg:grid-cols-5 as potentially intended */}
          {loading && page === 1 && !error ? (
            // Initial Loading Skeleton
            [...Array(ITEMS_PER_PAGE)].map((_, i) => <WallpaperSkeleton key={`skel-${i}`} />)
          ) : !loading && wallpapers.length === 0 && !error ? (
             // No Results Message
            <NoResults onClearFilters={handleClearFilters} category={selectedCategory} />
          ) : (
            // Display Wallpapers
            wallpapers.map(wallpaper => (
              <WallpaperCard 
                key={wallpaper._id} 
                wallpaper={wallpaper} 
                onClick={handleWallpaperClick}
              />
            ))
          )}
        </div>
          
        {/* Infinite Scroll Loading Indicator */} 
        {loading && page > 1 && (
          <div className="flex justify-center mt-6 md:mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
            
        {/* Intersection Observer Trigger */} 
        {!loading && hasMore && wallpapers.length > 0 && (
          <div ref={intersectionRef} style={{ height: '50px', marginTop: '20px' }} />
        )}
      </div>

      {/* Download Modal */} 
      {showDownloadModal && modalWallpaperData && (
        <SmartDownloadModal
          wallpaper={modalWallpaperData}
          isOpen={showDownloadModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 