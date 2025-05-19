import React from 'react';
import '../globals.css'; // Import necessary global styles

// Basic metadata for the layout (optional but good practice)
export const metadata = {
  title: 'Site Maintenance',
};

export default function FullPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children} {/* Render only the page content from app/(fullpage)/maintenance/page.tsx */}
      </body>
    </html>
  );
} 