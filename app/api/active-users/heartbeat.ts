import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demo (use Redis for production)
const ACTIVE_USERS: Record<string, number> = {};
const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

export async function POST(req: NextRequest) {
  // Get IP address
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             req.headers.get('x-real-ip') ||
             req.headers.get('remote-addr') ||
             'unknown';
  const now = Date.now();
  ACTIVE_USERS[ip] = now;

  // Clean up old entries
  for (const [key, ts] of Object.entries(ACTIVE_USERS)) {
    if (now - ts > ACTIVE_WINDOW_MS) {
      delete ACTIVE_USERS[key];
    }
  }

  return NextResponse.json({ success: true });
} 