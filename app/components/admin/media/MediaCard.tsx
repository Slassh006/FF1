'use client';
import React from 'react';
import { MediaItem } from '@/types/media';
import { useMediaStore } from '@/store/mediaStore';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import { FileText, Video, Image as ImageIcon, Edit, Trash2, Eye, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FaVideo, FaFileAlt } from 'react-icons/fa';
import type { IMedia } from '@/models/Media'; // Use IMedia based on linter feedback

interface MediaCardProps {
    item: IMedia;
    viewMode: 'grid' | 'list';
    onEdit: (item: IMedia) => void;
    onDelete: (item: IMedia) => void;
    onPreview: (item: IMedia) => void;
    isSelected: boolean;
    onSelect: (id: string, checked: boolean) => void;
}

// Helper to format bytes
const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper to copy URL
const copyUrlToClipboard = (url: string) => {
    if (!url) {
        toast.error('Cannot copy empty URL.');
        return;
    }
    const absoluteUrl = url.startsWith('http') ? url : window.location.origin + (url.startsWith('/') ? url : '/' + url);
    navigator.clipboard.writeText(absoluteUrl)
        .then(() => toast.success('URL copied!'))
        .catch(err => {
            console.error('Failed to copy URL: ', err);
            toast.error('Failed to copy URL.');
        });
};


const MediaCard: React.FC<MediaCardProps> = ({ item, viewMode, onEdit, onDelete, onPreview, isSelected, onSelect }) => {
    const { openModal, deleteMedia } = useMediaStore();

    const renderThumbnail = (isGrid: boolean) => {
        // Check if item and item.mimetype exist and are a string before calling startsWith
        const isVideo = typeof item?.mimetype === 'string' && item.mimetype.startsWith('video/');
        const isImage = typeof item?.mimetype === 'string' && item.mimetype.startsWith('image/');

        const placeholderIcon = isVideo ? (
            <FaVideo className="text-gray-500 w-8 h-8" />
        ) : (
            // Default to file icon if not video or if mimetype is missing/invalid
            <FaFileAlt className="text-gray-500 w-8 h-8" />
        );

        const imageSrc = item.slug ? `/api/admin/media/stream/${item.slug}` : '';

        // Check if it's an image AND we have a valid imageSrc
        if (isImage && imageSrc) {
            return (
                <NextImage
                    src={imageSrc}
                    alt={item.altText || item.filename}
                    fill
                    sizes={isGrid ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : "80px"}
                    className="object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        // Optionally find parent and show placeholder explicitly here
                    }}
                />
            );
        }
        
        // Fallback for non-images, missing src, or missing/invalid mimetype
        return <div className="flex items-center justify-center w-full h-full bg-gray-800">{placeholderIcon}</div>;
    };

    if (viewMode === 'list') {
        // Define button classes here, similar to grid view overlay
        const listButtonClass = "p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors";
        const errorButtonClass = `${listButtonClass} text-error hover:text-error hover:bg-error/10`;

        return (
             <motion.div
                className="flex items-center justify-between p-2 hover:bg-base-200/50 rounded transition-colors duration-150"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout
             >
                <div className="flex items-center space-x-3 overflow-hidden flex-grow">
                     <div className="w-16 h-10 flex-shrink-0 bg-base-300 rounded flex items-center justify-center overflow-hidden">
                         {renderThumbnail(false)}
                     </div>
                     <div className="flex-grow overflow-hidden pr-4">
                         <p className="text-sm font-medium truncate" title={item.filename || 'Untitled'}>{item.filename || 'Untitled'}</p>
                         <p className="text-xs text-gray-500">{formatBytes(item.size)} - {new Date(item.uploadDate).toLocaleDateString()}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-1 flex-shrink-0">
                     {/* Use defined classes */}
                     <button className={listButtonClass} title="Preview" onClick={() => openModal(item, 'preview')}>
                         <Eye className="w-4 h-4" />
                     </button>
                     <button className={listButtonClass} title="Edit" onClick={() => openModal(item, 'edit')}>
                         <Edit className="w-4 h-4" />
                     </button>
                     <button className={errorButtonClass} title="Delete" onClick={() => deleteMedia(item.slug)}>
                         <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
            </motion.div>
        );
    }

    const overlayClass = "absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10";
    const overlayButtonClass = "p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors";

    return (
        <motion.div
            className="relative group border border-gray-700 rounded-lg overflow-hidden bg-gray-800 shadow-sm aspect-square flex flex-col justify-center items-center transition-all duration-200 hover:shadow-lg hover:border-gray-600 cursor-pointer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            layout
            onClick={() => openModal(item, 'edit')}
        >
            <div className="absolute inset-0 flex items-center justify-center">
                {renderThumbnail(true)}
            </div>

            <div className={overlayClass} onClick={(e) => e.stopPropagation()}>
                 <p className="text-xs font-medium text-white truncate w-full px-1" title={item.filename || 'Untitled'}>{item.filename || 'Untitled'}</p>
                 <p className="text-[10px] text-gray-400 mb-2">{formatBytes(item.size)}</p>
                 <div className="flex items-center space-x-2 mt-auto">
                     <button
                         onClick={(e) => {
                             e.stopPropagation();
                             copyUrlToClipboard(`${window.location.origin}/api/admin/media/stream/${item.slug}`);
                         }}
                         className={overlayButtonClass}
                         title="Copy Stream URL"
                     >
                         <Copy size={14} />
                     </button>
                    <button
                        onClick={(e) => {e.stopPropagation(); openModal(item, 'edit');}}
                        className={overlayButtonClass}
                        title="Edit Details"
                    >
                       <Edit size={14} />
                    </button>
                     <button
                         onClick={(e) => {e.stopPropagation(); deleteMedia(item.slug);}}
                         className={overlayButtonClass}
                         title="Delete Media"
                     >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-4 z-0 pointer-events-none">
                 <p className="text-xs font-medium text-white truncate w-full" title={item.filename || 'Untitled'}>{item.filename || 'Untitled'}</p>
             </div>
        </motion.div>
    );
};

export default MediaCard;