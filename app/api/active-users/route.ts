import { NextRequest, NextResponse } from 'next/server';

// Use the same in-memory store as heartbeat endpoint
const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
if (!(globalThis as any).ACTIVE_USERS) {
  (globalThis as any).ACTIVE_USERS = {};
}
const ACTIVE_USERS: Record<string, number> = (globalThis as any).ACTIVE_USERS;

export async function GET(req: NextRequest) {
  const now = Date.now();
  // Filter only active users
  const users = Object.entries(ACTIVE_USERS)
    .filter(([_, ts]) => now - ts <= ACTIVE_WINDOW_MS)
    .map(([ip, ts]) => ({ ip, lastSeen: ts }));
  return NextResponse.json({ count: users.length, users });
} 