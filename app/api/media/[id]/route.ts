import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/app/lib/gridfs';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const startTime = Date.now();
  const { id } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'image'; // Type might be relevant later

  console.log(`[API/MEDIA/GET START] Request for ID: ${id}, Type: ${type}`);

  if (!id) {
    console.error('[API/MEDIA/GET ERROR] Missing file ID in request.');
    return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
  }

  try {
    // Get the file from GridFS (getFile now has enhanced logging)
    const { buffer, contentType } = await getFile(id);
    const duration = Date.now() - startTime;
    console.log(`[API/MEDIA/GET SUCCESS] Served file ID: ${id}, Type: ${contentType}, Size: ${buffer.length}. Duration: ${duration}ms`);

    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Long cache for immutable files
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    // Log the error with context
    console.error(`[API/MEDIA/GET ERROR] Failed to get file ID: ${id}. Duration: ${duration}ms`, error);
    
    let status = 500;
    let message = 'Failed to fetch file due to internal server error.';

    if (error instanceof Error) {
        if (error.message.includes('File not found') || error.message.includes('Invalid file ID format')) {
            status = 404;
            message = 'File not found';
        } else {
            message = error.message; // Use specific error message if available
        }
    }

    return NextResponse.json({ error: message }, { status: status });
  }
} 