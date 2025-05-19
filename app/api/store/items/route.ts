import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { StoreItemSchema } from '@/models/StoreItem';
import { ApiResponse } from '@/app/types/store';

// Initialize StoreItem model
const StoreItem = mongoose.models.StoreItem || mongoose.model('StoreItem', StoreItemSchema);

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    const items = await StoreItem.find({ status: 'active' })
      .select('name description price type image status inventory soldCount metadata')
      .sort('-createdAt');

    return NextResponse.json<ApiResponse<typeof items>>({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Failed to fetch store items:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch store items'
      },
      { status: 500 }
    );
  }
} 