import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Not implemented. Prisma is not used in this project.' }, { status: 501 });
} 