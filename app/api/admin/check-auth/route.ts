import { NextRequest, NextResponse } from 'next/server';
// import { verifyToken } from '@/lib/auth'; // Remove old import
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // Import NextAuth options

export async function GET(request: NextRequest) {
  try {
    // Use NextAuth session check
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.isAdmin) {
      // If no session or user is not an admin
      return NextResponse.json({ authenticated: false });
    }

    // If admin session exists
    return NextResponse.json({ authenticated: true, user: session.user });

  } catch (error) {
    console.error('Admin auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
} 