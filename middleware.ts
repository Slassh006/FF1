import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
// Remove Prisma import
// import { PrismaClient } from '@prisma/client';

// Import Mongoose and necessary components
// import dbConnect from '@/lib/dbConnect'; // Assuming dbConnect utility exists
// import Setting from '@/models/Setting'; // Assuming Setting model path

// Remove Prisma Client initialization
// const prisma = new PrismaClient();

// Paths that don't require authentication OR should be accessible during maintenance
const publicPaths = [
  '/', // Keep landing page public for maintenance mode info?
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about-us',
  '/disclaimer',
  '/blogs',
  '/gallery',
  '/redeem-codes',
  '/craftland-codes',
  '/maintenance', // Add maintenance page here
];

// Paths exempt from the maintenance check (e.g., static assets, auth API)
const maintenanceExemptPaths = [
  '/api/auth',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/maintenance',
  '/api/settings/maintenance', // Add the new API route here
];

export const config = {
  matcher: [
    // Match all paths except the ones explicitly exempt from maintenance/auth checks
    // Adjusted to ensure maintenance page and assets are not blocked by the matcher itself
    '/((?!api/auth|_next/static|_next/image|favicon.ico|maintenance|_ipx|api/settings/maintenance).*)',
    // Removed specific admin/profile matchers as they are covered by the general one now
  ],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;
  const isAdmin = token?.role === 'admin' || token?.isAdmin === true;

  console.log('[Middleware] Path:', pathname);
  // console.log('[Middleware] Token:', token); // Can be noisy, uncomment if needed
  console.log('[Middleware] isAdmin:', isAdmin);

  // --- Maintenance Mode Check ---
  let isMaintenanceEnabled = false; // Default to false
  try {
    // Fetch maintenance status from the internal API route
    const maintenanceApiUrl = new URL('/api/settings/maintenance', request.url);
    const response = await fetch(maintenanceApiUrl);

    if (response.ok) {
      const data = await response.json();
      isMaintenanceEnabled = data.enabled ?? false;
    } else {
      console.error(`[Middleware] Failed to fetch maintenance status: ${response.status}`);
      // Decide handling - fail open (false) or closed (true)? Defaulting to open.
    }

    console.log('[Middleware] Fetched maintenance status:', isMaintenanceEnabled);

    const isExempt = maintenanceExemptPaths.some(path => pathname.startsWith(path));
    console.log('[Middleware] Is Path Exempt:', isExempt);

    const shouldRedirect = isMaintenanceEnabled && !isAdmin && !isExempt;
    console.log('[Middleware] Should Redirect to Maintenance:', shouldRedirect);

    // If maintenance mode is ON, user is NOT admin, and path is NOT exempt
    if (shouldRedirect) {
      console.log('[Middleware] Redirecting to /maintenance');
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } catch (error) {
    console.error('[Middleware] Error checking maintenance mode (fetch failed?):', error);
    // Fail open if the fetch itself fails
  }
  // --- End Maintenance Mode Check ---


  // --- Authentication & Authorization Check ---
  
  // Check if the path is public (already checked maintenance exempt)
  const isPublic = publicPaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path + '/')));

  // Allow specific public API routes explicitly if needed
  if (
    pathname.startsWith('/api/wallpapers') || 
    pathname.startsWith('/api/blogs') ||
    pathname.startsWith('/api/register')
  ) {
     return NextResponse.next();
  }
  
  // If it's not a public path/API and user is not logged in, redirect to login
  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle protected admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin) {
      // Redirect non-admin users trying to access admin pages/API
      if (!pathname.startsWith('/api/')) {
         return NextResponse.redirect(new URL('/', request.url)); // Redirect pages
      } else {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }); // Deny API access
      }
    }
  }

  // Handle protected profile routes (example - already covered by !isPublic && !token check)
  // if (pathname.startsWith('/profile') || pathname.startsWith('/api/profile')) {
  //   // Basic check allows any logged-in user for profile/profile API
  // }

  // Default: Allow the request if it passed maintenance and auth checks
  return NextResponse.next();
} 