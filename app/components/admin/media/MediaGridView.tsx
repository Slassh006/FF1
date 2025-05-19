'use client';
import React from 'react';
import { MediaItem } from '@/types/media';
import MediaCard from './MediaCard';
import { AnimatePresence } from 'framer-motion';

interface MediaGridViewProps {
    items: MediaItem[];
}

const MediaGridView: React.FC<MediaGridViewProps> = ({ items }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
             <AnimatePresence>
                {items.map((item) => (
                    <MediaCard key={item.slug} item={item} viewMode="grid" />
                ))}
             </AnimatePresence>
        </div>
    );
};

export default MediaGridView; 