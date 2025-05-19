'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaEdit, FaTrash, FaEye, FaDownload, FaStar, FaGripVertical, FaImage } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Wallpaper } from '@/types/wallpaper';

interface WallpaperListProps {
  wallpapers: Wallpaper[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (wallpaper: Wallpaper) => void;
  onListRefresh: () => void;
}

// Sortable Row Component
function SortableWallpaperRow({ wallpaper, onPreview, onEdit, onDelete, selectedWallpapers, handleSelect }: {
  wallpaper: Wallpaper;
  onPreview: (wallpaper: Wallpaper) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  selectedWallpapers: string[];
  handleSelect: (id: string, checked: boolean) => void;
}) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging
  } = useSortable({ id: wallpaper._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1, 
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`hover:bg-gray-700/50 ${isDragging ? 'bg-gray-700 shadow-lg' : ''}`}
    >
      {/* Drag Handle */}
      <td className="px-2 py-3 w-10 text-center cursor-grab" {...attributes} {...listeners}>
        <FaGripVertical className="text-gray-500 mx-auto" />
      </td>
      {/* Checkbox */}<td className="px-4 py-3"><input type="checkbox" checked={selectedWallpapers.includes(wallpaper._id)} onChange={(e) => handleSelect(wallpaper._id, e.target.checked)} className="rounded bg-gray-700 border-transparent focus:ring-primary focus:border-primary" /></td>
      {/* Preview */}
      <td className="px-4 py-3 cursor-pointer" onClick={() => onPreview(wallpaper)}>
        <div className="relative w-16 h-9 sm:w-20 sm:h-12 rounded overflow-hidden bg-dark flex items-center justify-center border border-primary/10">
          {wallpaper.thumbnailUrl ? (
            <Image 
              src={wallpaper.thumbnailUrl}
              alt={wallpaper.title || 'Wallpaper thumbnail'} 
              fill 
              className="object-cover" 
              sizes="80px"
              onError={(e) => { 
                (e.target as HTMLImageElement).style.display = 'none'; 
              }}
            />
          ) : (
            <FaImage className="text-gray-500 w-6 h-6" />
          )}
        </div>
      </td>
      {/* Title */}<td className="px-4 py-3 text-sm text-white whitespace-nowrap max-w-[150px] sm:max-w-xs truncate" title={wallpaper.title}>{wallpaper.title}</td>
      {/* Category */}<td className="px-4 py-3 text-sm text-white hidden sm:table-cell">{wallpaper.category}</td>
      {/* Downloads */}<td className="px-4 py-3 text-sm text-white hidden md:table-cell"><div className="flex items-center"><FaDownload className="mr-1.5" size={12}/> {wallpaper.downloads ?? 0}</div></td>
      {/* Date Added */}<td className="px-4 py-3 text-sm text-white hidden md:table-cell whitespace-nowrap">
        {wallpaper.createdAt ? new Date(wallpaper.createdAt).toLocaleDateString() : 'N/A'}
      </td>
      {/* Status */}<td className="px-4 py-3 hidden sm:table-cell"><div className="flex flex-wrap gap-1">{wallpaper.isPublished && <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400">Published</span>}{wallpaper.isHD && <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">HD</span>}{wallpaper.isNew && <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400">New</span>}</div></td>
      {/* Actions */}<td className="px-4 py-3 whitespace-nowrap"><div className="flex space-x-3"><button onClick={() => onPreview(wallpaper)} className="text-blue-400 hover:text-blue-300 transition-colors" title="Preview"><FaEye /></button><button onClick={() => onEdit(wallpaper._id)} className="text-yellow-400 hover:text-yellow-300 transition-colors" title="Edit"><FaEdit /></button><button onClick={() => onDelete(wallpaper._id)} className="text-red-400 hover:text-red-300 transition-colors" title="Delete"><FaTrash /></button></div></td>
    </tr>
  );
}

export default function WallpaperList({ wallpapers, onEdit, onDelete, onPreview, onListRefresh }: WallpaperListProps) {
  const [selectedWallpapers, setSelectedWallpapers] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedWallpapers(wallpapers.map(w => w._id));
    } else {
      setSelectedWallpapers([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedWallpapers(prev =>
      checked
        ? [...prev, id]
        : prev.filter(selectedId => selectedId !== id)
    );
  };

  const handleBulkAction = async (action: 'delete' | 'publish' | 'unpublish') => {
    if (!selectedWallpapers.length) {
      toast.error('Please select wallpapers first');
      return;
    }
    
    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedWallpapers.length} selected wallpaper(s)?`)) {
        return;
    }

    const toastId = toast.loading(`Performing ${action} action...`);
    let success = false;
    let errorMessage = `Failed to perform bulk ${action} action`;

    try {
      const response = await fetch('/api/admin/wallpapers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, wallpaperIds: selectedWallpapers }),
        credentials: 'include',
      });

      if (!response.ok) {
          try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
          } catch (e) { /* Ignore if response body is not JSON */ }
          throw new Error(errorMessage);
      }

      toast.success(`Successfully ${action}ed selected wallpapers`, { id: toastId });
      setSelectedWallpapers([]);
      onListRefresh();
      success = true;

    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error(error instanceof Error ? error.message : errorMessage, { id: toastId });
    } 
  };

  return (
    <div className="space-y-4">
      {wallpapers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-700 pb-4">
          <span className="text-sm text-gray-400 self-center mr-2">
            {selectedWallpapers.length > 0 ? `${selectedWallpapers.length} selected` : "Bulk Actions:"}
          </span>
          <button
            onClick={() => handleBulkAction('publish')}
            className="px-3 py-1 text-xs sm:text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!selectedWallpapers.length}
            title="Publish selected wallpapers"
          >
            Publish
          </button>
          <button
            onClick={() => handleBulkAction('unpublish')}
            className="px-3 py-1 text-xs sm:text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!selectedWallpapers.length}
            title="Unpublish selected wallpapers"
          >
            Unpublish
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            className="px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={!selectedWallpapers.length}
            title="Delete selected wallpapers"
          >
            Delete
          </button>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800/50"> 
            <tr>
              <th className="px-2 py-3 w-10" title="Drag to reorder"></th>
              <th className="px-4 py-3">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={wallpapers.length > 0 && selectedWallpapers.length === wallpapers.length}
                  disabled={wallpapers.length === 0}
                  className="rounded bg-gray-700 border-transparent focus:ring-primary focus:border-primary" 
                  title="Select/Deselect All"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Preview</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">Downloads</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">Date Added</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {wallpapers.map((wallpaper) => (
              <SortableWallpaperRow 
                key={wallpaper._id} 
                wallpaper={wallpaper} 
                onPreview={onPreview} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                selectedWallpapers={selectedWallpapers}
                handleSelect={handleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 