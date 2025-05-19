import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import WallpaperUploadForm from '@/app/components/admin/WallpaperUploadForm';

export default async function NewWallpaperPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    redirect('/admin/login');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Add New Wallpaper</h1>
      <WallpaperUploadForm />
    </div>
  );
} 