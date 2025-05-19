'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMediaStore } from '@/store/mediaStore'; // Adjust path
import UploadMedia from './UploadMedia';
import MediaFilters from './MediaFilters';
import MediaGridView from './MediaGridView';
import MediaListView from './MediaListView';
import MediaModal from './MediaModal';
import { useInView } from 'react-intersection-observer'; // Install: npm install react-intersection-observer
import { LayoutGrid, List } from 'lucide-react'; // Example icons

const MediaGallery: React.FC = () => {
    const {
        mediaItems,
        pagination,
        isLoading,
        error,
        fetchMedia,
        filters
    } = useMediaStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // --- Infinite Scroll / Pagination Trigger ---
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.5, // Trigger when 50% visible
    });

     // Ref to track if we are currently fetching the next page to prevent duplicates
     const isFetchingNextPage = useRef(false);
     // Ref to store the fetchMedia function to avoid useEffect dependency issues
     const fetchMediaRef = useRef(fetchMedia);

     // Update the ref whenever fetchMedia changes (though it should be stable from Zustand)
     useEffect(() => {
        fetchMediaRef.current = fetchMedia;
     }, [fetchMedia]);

     useEffect(() => {
        // Fetch initial data on mount using the ref
        fetchMediaRef.current();
     }, []); // Empty dependency array ensures this runs only once on mount

    // Effect to load more items when the trigger element is in view
    useEffect(() => {
        if (
            inView && // Is the trigger visible?
            !isLoading && // Not already loading?
            !isFetchingNextPage.current && // Not currently fetching next page?
            pagination && pagination.hasNextPage // Is there a next page?
        ) {
            console.log("Loading next page...");
            isFetchingNextPage.current = true; // Set flag
            // Use the ref to call fetchMedia
            fetchMediaRef.current({ page: filters.page ? filters.page + 1 : 2 }) // Fetch next page
                .finally(() => {
                    isFetchingNextPage.current = false; // Reset flag after fetch completes
                 });
        }
    }, [inView, isLoading, pagination, filters.page]); // Include filters.page as dependency


    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-4">Media Gallery</h1>

            <UploadMedia />

            <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
                <MediaFilters />
                {/* View Mode Toggle */}
                <div className="flex-shrink-0">
                     <div className="join">
                        <button
                             className={`btn join-item btn-sm ${viewMode === 'grid' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                             onClick={() => setViewMode('grid')}
                             aria-label="Grid View"
                        >
                             <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                             className={`btn join-item btn-sm ${viewMode === 'list' ? 'btn-active btn-primary' : 'btn-ghost'}`}
                             onClick={() => setViewMode('list')}
                             aria-label="List View"
                        >
                             <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>


            {error && (
                 <div role="alert" className="alert alert-error mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Error! {error}</span>
                 </div>
             )}

            {/* Display Media Items */}
            {!isLoading && mediaItems.length === 0 && !error && pagination && pagination.totalItems === 0 && (
                <div className="text-center py-10 text-base-content/70">
                    <p>No media items found matching your criteria.</p>
                </div>
            )}

            {/* Show grid/list only if there are items or if it's loading the initial batch */} 
            {(mediaItems.length > 0 || (isLoading && (!pagination || pagination.page === 1))) && (
                viewMode === 'grid'
                    ? <MediaGridView items={mediaItems} />
                    : <MediaListView items={mediaItems} />
             )}

            {/* Loading Indicator (specifically for pagination/infinite scroll) */} 
            {isLoading && pagination && pagination.page && pagination.page > 1 && (
                 <div className="text-center py-6">
                     <span className="loading loading-dots loading-md text-primary"></span>
                 </div>
             )}

            {/* Intersection Observer Trigger for Infinite Scroll */} 
            {!isLoading && pagination?.hasNextPage && (
                 <div ref={loadMoreRef} className="h-10 w-full"></div> // Invisible trigger element
             )}

            {/* Modal for Preview/Edit */}
            <MediaModal />
        </div>
    );
};

export default MediaGallery; 