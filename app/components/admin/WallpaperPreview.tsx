import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaEdit, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface WallpaperPreviewProps {
  title: string;
  imageUrl: string;
  resolution?: string;
  downloads: number;
  views: number;
  category: string;
  isPublished: boolean;
  isHD: boolean;
  isNew: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

export default function WallpaperPreview({
  title,
  imageUrl,
  resolution,
  downloads,
  views,
  category,
  isPublished,
  isHD,
  isNew,
  onClose,
  onEdit,
  onDelete,
  onDownload
}: WallpaperPreviewProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-gray-900 rounded-lg overflow-hidden max-w-3xl w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Image and Quick Actions */}
        <div className="relative aspect-video">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain bg-black/50"
            quality={90}
            priority
          />
          
          {/* Status Badges */}
          <div className="absolute top-2 right-2 flex gap-2">
            {isPublished && (
              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                Published
              </span>
            )}
            {isHD && (
              <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                HD
              </span>
            )}
            {isNew && (
              <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                New
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="absolute bottom-2 right-2 flex gap-2">
            {!confirmDelete ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEdit}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
                >
                  <FaEdit size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDelete(true)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg"
                >
                  <FaTrash size={16} />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDelete}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg"
                >
                  <FaCheck size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDelete(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg"
                >
                  <FaTimes size={16} />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Category:</span>
              <span className="text-white font-medium">{category}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Resolution:</span>
              <span className="text-white font-medium">{resolution || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Downloads:</span>
              <span className="text-white font-medium">{downloads}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Views:</span>
              <span className="text-white font-medium">{views}</span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
          <button
            onClick={onDownload}
            className="bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <FaDownload size={16} /> Download Original
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 