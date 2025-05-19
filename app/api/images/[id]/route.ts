import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/app/lib/gridfs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    const { buffer, contentType } = await getFile(fileId);

    // Create response with proper content type
    const response = new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

    return response;
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Image not found', { status: 404 });
  }
} 