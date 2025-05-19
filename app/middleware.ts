import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const adminPaths = [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/settings',
    // '/admin/gallery', // Removed
    '/admin/content', 
];

const adminApiPaths = [
    '/api/admin/users',
    '/api/admin/settings',
    // '/api/admin/media', // Removed
    '/api/admin/content',
];

const protectedUserPaths = [
    '/profile',
    // Add other paths requiring login but not admin
    '/api/profile',
];


export async function middleware(request: NextRequest) {
    // Use NEXTAUTH_SECRET environment variable by default
    const token = await getToken({ req: request }); 
    const { pathname } = request.nextUrl;

    // --- Admin Route Protection ---
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
    const isAdminApiPath = adminApiPaths.some(path => pathname.startsWith(path));

    if (isAdminPath || isAdminApiPath) {
        // Check if token exists and if the user role is admin or superadmin
        if (!token || !(token.role === 'admin' || token.role === 'superadmin')) { // Adjusted logic
            // For API routes, return 403 Forbidden JSON
            if (isAdminApiPath) {
                return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
            }
            // For page routes, redirect to login or an unauthorized page
            const url = request.nextUrl.clone();
            url.pathname = '/login'; // Or '/unauthorized' or '/'
            url.searchParams.set('callbackUrl', pathname);
            console.log(`Redirecting unauthorized user from admin path ${pathname} to ${url.pathname}`);
            return NextResponse.redirect(url);
        }
        console.log(`Admin access granted for ${pathname}`);
    }

    // --- Authenticated User Route Protection ---
    const isProtectedUserPath = protectedUserPaths.some(path => pathname.startsWith(path));

    if (isProtectedUserPath) {
        // Check only if a token exists (any role is sufficient here)
        if (!token) {
            // For API routes, return 401 Unauthorized JSON
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
            }
            // For page routes, redirect to login
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('callbackUrl', pathname);
            console.log(`Redirecting unauthenticated user from protected path ${pathname} to ${url.pathname}`);
            return NextResponse.redirect(url);
        }
        console.log(`Authenticated access granted for ${pathname}`);
    }

    // Allow the request to proceed by default
    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico 
         * - / (public homepage, if intended)
         * - /login
         * - /register
         * - /images (public assets)
         * - /public (public assets)
         * - /api/public (public API endpoints)
         * - /api/files (GridFS files - ASSUMED PUBLIC, adjust if needed)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|login$|register$|images|public|api/public|api/files).*)',
        // You might need to explicitly include '/' if it needs protection logic
        // '/', 
    ],
}; 