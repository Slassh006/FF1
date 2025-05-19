import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import { connectDB } from '../../../../lib/db';
import Wallpaper from '@/app/models/Wallpaper';
import WallpaperEditFormWrapper from '@/app/components/admin/WallpaperEditFormWrapper';

interface Props {
  params: {
    id: string;
  };
}

export default async function EditWallpaperPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    redirect('/admin/login');
  }

  let wallpaperDoc;
  try {
    await connectDB();
    wallpaperDoc = await Wallpaper.findById(params.id);
  } catch (error) {
    console.error("Database error fetching wallpaper:", error);
    // Redirect to the list page if DB connection or fetch fails
    redirect('/admin/wallpapers?error=db_fetch_failed'); 
  }
  
  if (!wallpaperDoc) {
    // Optional: Add query param for not found?
    redirect('/admin/wallpapers?error=not_found');
  }

  // Convert Mongoose document to plain object and ensure all required fields exist
  const wallpaper = JSON.parse(JSON.stringify(wallpaperDoc));
  
  // Ensure all required fields have default values to prevent undefined errors
  wallpaper.title = wallpaper.title || '';
  wallpaper.description = wallpaper.description || '';
  wallpaper.imageUrl = wallpaper.imageUrl || '';
  wallpaper.thumbnailUrl = wallpaper.thumbnailUrl || '';
  wallpaper.originalImageUrl = wallpaper.originalImageUrl || '';
  wallpaper.resolution = wallpaper.resolution || '1920x1080';
  wallpaper.category = wallpaper.category || 'Free Fire';
  wallpaper.tags = Array.isArray(wallpaper.tags) ? wallpaper.tags : [];
  wallpaper.downloads = wallpaper.downloads || 0;
  wallpaper.likes = wallpaper.likes || 0;
  wallpaper.viewCount = wallpaper.viewCount || 0;
  wallpaper.isPublished = wallpaper.isPublished || false;
  wallpaper.isHD = wallpaper.isHD || false;
  wallpaper.isNew = wallpaper.isNew || false;
  wallpaper.isTrending = wallpaper.isTrending || false;
  wallpaper.contentType = wallpaper.contentType || 'image/jpeg';
  wallpaper.createdAt = wallpaper.createdAt || new Date().toISOString();
  wallpaper.updatedAt = wallpaper.updatedAt || new Date().toISOString();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Wallpaper</h1>
      <WallpaperEditFormWrapper 
        wallpaper={wallpaper} 
      />
    </div>
  );
} 