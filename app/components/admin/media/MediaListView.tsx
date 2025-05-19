'use client';
import React from 'react';
import { MediaItem } from '@/types/media';
import MediaCard from './MediaCard';
import { AnimatePresence, motion } from 'framer-motion';

interface MediaListViewProps {
    items: MediaItem[];
}

const MediaListView: React.FC<MediaListViewProps> = ({ items }) => {
    return (
        <div className="space-y-1">
            {/* Optional Header Row */}
             <div className="hidden md:flex items-center justify-between p-2 text-xs font-semibold text-gray-500 border-b border-base-300">
                 <div className="flex items-center space-x-3 flex-grow overflow-hidden pl-20"> {/* Align with card content */}
                     <span>Filename</span>
                 </div>
                 <div className="flex items-center space-x-1 flex-shrink-0 pr-10"> {/* Align with card actions */}
                     <span>Actions</span>
                 </div>
            </div>
             <AnimatePresence>
                 {items.map((item) => (
                    <motion.div key={item.slug} layout> {/* Add layout for smooth reordering */}
                        <MediaCard item={item} viewMode="list" />
                    </motion.div>
                 ))}
             </AnimatePresence>
         </div>
    );
};

export default MediaListView; 