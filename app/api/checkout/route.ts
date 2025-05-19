import { NextRequest, NextResponse } from 'next/server';

/**
 * This endpoint redirects to the correct checkout endpoint at /api/profile/cart/checkout
 * It exists to maintain backward compatibility with existing code that might be using this endpoint
 */
export async function POST(request: NextRequest) {
  // Log that this endpoint was called (for debugging)
  console.log('[API Checkout] Redirecting to /api/profile/cart/checkout');
  
  // Forward the request to the correct endpoint
  const response = await fetch(new URL('/api/profile/cart/checkout', request.url), {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  });
  
  // Return the response from the correct endpoint
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
} 