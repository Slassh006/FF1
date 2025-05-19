import React from 'react';
import MediaGallery from '@/app/components/admin/media/MediaGallery'; // Adjust path
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Adjust path
import { redirect } from 'next/navigation';

// Optional: Add metadata
export const metadata = {
    title: 'Media Gallery | Admin Panel',
};

// This page should be protected (e.g., via middleware or layout check)
// Adding an explicit check here too for clarity
export default async function AdminMediaPage() {
     const session = await getServerSession(authOptions);

     // Redirect if not logged in or not an admin
     // Adjust the redirect URL as needed
     if (!session || !session.user?.isAdmin) {
         redirect('/login?redirect=/admin/media'); // Or redirect to an unauthorized page
     }

    return (
        // Ensure your main admin layout provides necessary structure/styles
        <div>
            <MediaGallery />
        </div>
    );
} 