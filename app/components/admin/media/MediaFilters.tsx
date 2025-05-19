'use client';
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useMediaStore } from '@/store/mediaStore'; // Adjust path
import { Search, ListFilter } from 'lucide-react'; // Example icons
import debounce from 'lodash.debounce'; // Install: npm install lodash.debounce @types/lodash.debounce

const MediaFilters: React.FC = () => {
    const { filters, setFilters } = useMediaStore();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Debounce search input
    const debouncedSetFilters = useCallback(
        debounce((value: string) => {
            setFilters({ search: value });
        }, 500), // 500ms delay
        [setFilters] // Dependency array for useCallback
    );

    useEffect(() => {
         debouncedSetFilters(searchTerm);
         // Cleanup debounce on unmount
         return () => debouncedSetFilters.cancel();
     }, [searchTerm, debouncedSetFilters]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters({ type: e.target.value as any });
    };

     const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [sortBy, sortOrder] = e.target.value.split(',');
         setFilters({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
     };

    return (
        <div className="mb-4 p-4 bg-base-200 rounded-lg flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="form-control flex-grow min-w-[200px]">
                 <label className="input input-bordered flex items-center gap-2">
                     <Search className="w-4 h-4 opacity-70" />
                     <input
                        type="text"
                        className="grow"
                        placeholder="Search by name, caption..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                 </label>
             </div>

            {/* Type Filter Dropdown */}
             <div className="form-control min-w-[150px]">
                 <label className="label sr-only" htmlFor="mediaTypeFilter">File Type</label>
                 <select
                     id="mediaTypeFilter"
                     className="select select-bordered w-full"
                     value={filters.type}
                     onChange={handleTypeChange}
                 >
                     <option value="">All Types</option>
                     <option value="image">Images</option>
                     <option value="video">Videos</option>
                     <option value="document">Documents</option>
                     {/* Add other types as needed */}
                 </select>
             </div>

             {/* Sorting Dropdown */}
            <div className="form-control min-w-[180px]">
                 <label className="label sr-only" htmlFor="mediaSort">Sort By</label>
                <select
                     id="mediaSort"
                     className="select select-bordered w-full"
                     value={`${filters.sortBy},${filters.sortOrder}`}
                     onChange={handleSortChange}
                 >
                    <option value="uploadDate,desc">Upload Date (Newest)</option>
                    <option value="uploadDate,asc">Upload Date (Oldest)</option>
                     <option value="filename,asc">Filename (A-Z)</option>
                     <option value="filename,desc">Filename (Z-A)</option>
                     <option value="size,desc">Size (Largest)</option>
                     <option value="size,asc">Size (Smallest)</option>
                </select>
            </div>

             {/* Add Date Range Filter if needed */}
         </div>
    );
};

export default MediaFilters; 