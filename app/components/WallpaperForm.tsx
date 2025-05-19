import { useState, useEffect } from 'react';
import { FaUpload } from 'react-icons/fa';

interface WallpaperFormProps {
  wallpaper?: {
    id?: number;
    title: string;
    imageUrl: string;
    resolution: string;
    category: string;
  };
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export default function WallpaperForm({ wallpaper, onSubmit, onCancel }: WallpaperFormProps) {
  const [title, setTitle] = useState(wallpaper?.title || '');
  const [imageUrl, setImageUrl] = useState(wallpaper?.imageUrl || '');
  const [resolution, setResolution] = useState(wallpaper?.resolution || '1920x1080');
  const [category, setCategory] = useState(wallpaper?.category || 'Character');
  const [previewUrl, setPreviewUrl] = useState(wallpaper?.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const categories = ['Character', 'Landscape', 'Action', 'Weapons', 'Team'];
  const resolutions = ['1920x1080', '2560x1440', '3840x2160'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (wallpaper?.id) {
      formData.append('id', wallpaper.id.toString());
    }
    formData.append('title', title);
    formData.append('resolution', resolution);
    formData.append('category', category);
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (imageUrl) {
      formData.append('imageUrl', imageUrl);
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 bg-secondary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter wallpaper title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Image
        </label>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                id="wallpaper-image"
              />
              <label
                htmlFor="wallpaper-image"
                className="flex items-center justify-center w-full px-4 py-2 bg-secondary text-white rounded-lg cursor-pointer hover:bg-secondary/80"
              >
                <FaUpload className="mr-2" />
                Choose Image
              </label>
            </div>
            {!imageFile && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="mt-2 w-full px-4 py-2 bg-secondary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Or enter image URL"
              />
            )}
          </div>
          {previewUrl && (
            <div className="w-32 h-20">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Resolution
          </label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full px-4 py-2 bg-secondary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {resolutions.map(res => (
              <option key={res} value={res}>{res}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-secondary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-dark rounded-lg hover:bg-primary/80"
        >
          {wallpaper ? 'Update' : 'Add'} Wallpaper
        </button>
      </div>
    </form>
  );
} 