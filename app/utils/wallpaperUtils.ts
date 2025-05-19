import Wallpaper, { IWallpaper } from '@/app/models/Wallpaper';
// Import a simple seeded random number generator
import seedrandom from 'seedrandom';

export type SortOption = 'latest' | 'downloads' | 'likes';

export function getSortQuery(sort: SortOption) {
  switch (sort) {
    case 'latest':
      return { createdAt: -1 };
    case 'downloads':
      return { downloadCount: -1 };
    case 'likes':
      return { likeCount: -1 };
    default:
      return { createdAt: -1 };
  }
}

// Seeded Fisher-Yates Shuffle function
function seededShuffle<T>(array: T[], seed: string): T[] {
  const rng = seedrandom(seed);
  let currentIndex = array.length;
  let temporaryValue: T;
  let randomIndex: number;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(rng() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export function formatWallpaperResponse(wallpapers: IWallpaper[], total: number, page: number, limit: number) {
  // Validate input
  if (!Array.isArray(wallpapers)) {
    // It's better to return an empty valid structure or handle this in the API route
    console.error('formatWallpaperResponse received non-array for wallpapers');
    return { wallpapers: [], hasMore: false }; 
  }

  if (typeof total !== 'number' || total < 0 || typeof page !== 'number' || page < 1 || typeof limit !== 'number' || limit < 1) {
    console.error('formatWallpaperResponse received invalid pagination parameters');
    // Return based on what we have, assuming no more pages
    return { wallpapers: wallpapers.map(w => ({ ...w })), hasMore: false }; 
  }

  // Don't overwrite URLs, just ensure the structure is correct
  // The wallpapers array already contains the correct URLs from the database
  // const formattedWallpapers = wallpapers.map(wallpaper => ({
  //   ...wallpaper,
  //   imageUrl: `/api/wallpapers/${wallpaper._id}/image`,
  //   thumbnailUrl: `/api/wallpapers/${wallpaper._id}/thumbnail`,
  //   downloadUrl: `/api/wallpapers/${wallpaper._id}/download`,
  // }));

  // Calculate hasMore directly
  const hasMore = page * limit < total;

  // Return the structure expected by the frontend
  return {
    wallpapers: wallpapers, // Return the original wallpapers with correct URLs
    hasMore: hasMore,
  };
}

// Export the shuffle function if needed elsewhere, otherwise keep it internal
export { seededShuffle }; 