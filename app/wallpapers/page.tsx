'use client';

import { useState, useEffect } from 'react';
import WallpaperCard from '../components/WallpaperCard';
import WallpaperPreviewModal from '../components/WallpaperPreviewModal';
import { FaSearch, FaFilter } from 'react-icons/fa';

// Sample wallpapers data - in a real app, this would come from an API
const wallpapers = [
  {
    _id: 'sample-1',
    title: 'Free Fire Character Battle',
    description: 'Epic battle scene featuring Free Fire characters in action',
    imageUrl: 'https://wallpapercave.com/wp/wp9276911.jpg',
    thumbnailUrl: 'https://wallpapercave.com/wp/wp9276911.jpg',
    resolution: '1920x1080',
    category: 'Characters',
    tags: ['battle', 'action', 'characters'],
    downloads: 120,
    likes: 45,
    viewCount: 320,
    isHD: true,
    isNew: true,
    isTrending: false
  },
  {
    _id: 'sample-2',
    title: 'Free Fire Battleground',
    description: 'Stunning landscape of the Free Fire battleground',
    imageUrl: 'https://wallpapercave.com/wp/wp9276924.jpg',
    thumbnailUrl: 'https://wallpapercave.com/wp/wp9276924.jpg',
    resolution: '1920x1080',
    category: 'Maps',
    tags: ['landscape', 'battleground', 'environment'],
    downloads: 98,
    likes: 32,
    viewCount: 245,
    isHD: true,
    isNew: false,
    isTrending: true
  },
  {
    _id: 'sample-3',
    title: 'Free Fire Heroes',
    description: 'All your favorite Free Fire heroes in one epic wallpaper',
    imageUrl: 'https://wallpapercave.com/wp/wp9276935.jpg',
    thumbnailUrl: 'https://wallpapercave.com/wp/wp9276935.jpg',
    resolution: '1920x1080',
    category: 'Characters',
    tags: ['heroes', 'characters', 'epic'],
    downloads: 156,
    likes: 67,
    viewCount: 412,
    isHD: true,
    isNew: false,
    isTrending: true
  },
  {
    _id: 'sample-4',
    title: 'Free Fire Action',
    description: 'High-octane action scene from Free Fire',
    imageUrl: 'https://wallpapercave.com/wp/wp9276947.jpg',
    thumbnailUrl: 'https://wallpapercave.com/wp/wp9276947.jpg',
    resolution: '1920x1080',
    category: 'Free Fire',
    tags: ['action', 'battle', 'epic'],
    downloads: 87,
    likes: 29,
    viewCount: 198,
    isHD: true,
    isNew: true,
    isTrending: false
  },
  {
    _id: 'sample-5',
    title: 'Free Fire Weapons',
    description: 'Showcase of the most powerful weapons in Free Fire',
    imageUrl: 'https://wallpapercave.com/wp/wp9276958.jpg',
    thumbnailUrl: 'https://wallpapercave.com/wp/wp9276958.jpg',
    resolution: '1920x1080',
    category: 'Weapons',
    tags: ['weapons', 'guns', 'arsenal'],
    downloads: 112,
    likes: 41,
    viewCount: 287,
    isHD: true,
    isNew: false,
    isTrending: false
  },
  {
    _id: 'sample-6',
    title: 'Free Fire Squad',
    description: 'Team up with your squad in Free Fire',
    imageUrl: 'https://wallpapercave.com/wp/wp9276969.jpg',
    thumbnailUrl: 'https://wallpapercave.com/wp/wp9276969.jpg',
    resolution: '1920x1080',
    category: 'Free Fire',
    tags: ['squad', 'team', 'cooperation'],
    downloads: 134,
    likes: 53,
    viewCount: 356,
    isHD: true,
    isNew: false,
    isTrending: true
  }
];

export default function WallpapersPage() {
  const [selectedWallpaper, setSelectedWallpaper] = useState<null | typeof wallpapers[0]>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filteredWallpapers, setFilteredWallpapers] = useState(wallpapers);

  // Filter wallpapers based on search term and category
  useEffect(() => {
    let filtered = [...wallpapers];
    
    if (searchTerm) {
      filtered = filtered.filter(wallpaper => 
        wallpaper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallpaper.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallpaper.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(wallpaper => wallpaper.category === selectedCategory);
    }
    
    setFilteredWallpapers(filtered);
  }, [searchTerm, selectedCategory]);

  const handleWallpaperClick = (wallpaper: typeof wallpapers[0]) => {
    setSelectedWallpaper(wallpaper);
  };

  const handleCloseModal = () => {
    setSelectedWallpaper(null);
  };

  const handleDownloadComplete = () => {
    // Update download count in the UI
    if (selectedWallpaper) {
      setFilteredWallpapers(prev => 
        prev.map(w => 
          w._id === selectedWallpaper._id 
            ? { ...w, downloads: w.downloads + 1 } 
            : w
        )
      );
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(wallpapers.map(w => w.category)));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white font-orbitron">Wallpapers</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-grow sm:max-w-xs">
            <input
              type="text"
              placeholder="Search wallpapers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-dark/50 border border-primary/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50" />
          </div>
          
          {/* Category filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-dark/50 border border-primary/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none pr-10"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Wallpapers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWallpapers.map((wallpaper) => (
          <div
            key={wallpaper._id}
            onClick={() => handleWallpaperClick(wallpaper)}
            className="cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
          >
            <WallpaperCard
              id={wallpaper._id}
              title={wallpaper.title}
              description={wallpaper.description}
              imageUrl={wallpaper.imageUrl}
              thumbnailUrl={wallpaper.thumbnailUrl}
              downloadUrl={wallpaper.imageUrl}
              category={wallpaper.category}
              tags={wallpaper.tags}
              viewCount={wallpaper.viewCount}
              downloadCount={wallpaper.downloads}
              likeCount={wallpaper.likes}
              isHD={wallpaper.isHD}
              isNew={wallpaper.isNew}
              isTrending={wallpaper.isTrending}
            />
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredWallpapers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/70 text-lg">No wallpapers found matching your criteria.</p>
        </div>
      )}

      {/* Modal */}
      {selectedWallpaper && (
        <WallpaperPreviewModal
          wallpaper={selectedWallpaper}
          onClose={handleCloseModal}
          onDownloadComplete={handleDownloadComplete}
        />
      )}
    </div>
  );
} 