import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from './components/Navbar';
import ConditionalFooter from './components/ConditionalFooter';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/options';
import Providers from './components/Providers';
import { Toaster } from 'react-hot-toast';
import { initializeApp } from './lib/init';
import { useEffect } from 'react';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFD700' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  colorScheme: 'dark'
};

export const metadata: Metadata = {
  title: {
    template: '%s | TheFreeFireIndia',
    default: 'TheFreeFireIndia - Your Ultimate Free Fire Fan Hub',
  },
  description: 'Your ultimate destination for Free Fire news, updates, redeem codes, and more.',
  keywords: ['Free Fire', 'Gaming', 'Redeem Codes', 'News', 'Updates'],
  authors: [{ name: 'TheFreeFireIndia Team' }],
  creator: 'TheFreeFireIndia',
  publisher: 'TheFreeFireIndia',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'TheFreeFireIndia - Hub for Free Fire Fans in India',
    description: 'Your ultimate destination for Free Fire India content - wallpapers, redeem codes, blogs, and Craftland maps.',
    url: 'https://thefreefireindia.com',
    siteName: 'TheFreeFireIndia',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TheFreeFireIndia',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TheFreeFireIndia - Hub for Free Fire Fans in India',
    description: 'Your ultimate destination for Free Fire India content - wallpapers, redeem codes, blogs, and Craftland maps.',
    images: ['/images/og-image.jpg'],
    creator: '@TheFreeFireIndia',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    // other verifications if any
  },
  alternates: {
    canonical: 'https://thefreefireindia.com',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TheFreeFireIndia',
  },
  formatDetection: {
    telephone: false,
  },
};

// Initialize the app
initializeApp();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFD700" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen flex flex-col antialiased`} suppressHydrationWarning>
        <Providers session={session}>
          <Navbar />
          <main className="flex-grow relative">
            <div className="pt-16 min-h-[calc(100vh-4rem)]">{children}</div>
          </main>
          <ConditionalFooter />
        </Providers>
        <Toaster 
          position="bottom-center"
          containerStyle={{
            bottom: 20,
          }}
          toastOptions={{
            duration: 5000,
            style: {
              background: '#0A0A0A',
              color: '#FFFFFF',
              fontFamily: inter.style.fontFamily,
              border: '1px solid #FFD70030',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }} 
        />
      </body>
    </html>
  );
} 