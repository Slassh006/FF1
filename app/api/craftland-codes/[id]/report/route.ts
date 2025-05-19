import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/app/lib/mongodb';
import CraftlandCode from '@/app/models/CraftlandCode';
import { z } from 'zod';

const reportSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  category: z.enum(['spam', 'inappropriate', 'broken', 'duplicate', 'other']),
  details: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const validatedData = reportSchema.parse(body);
    
    const craftlandCode = await CraftlandCode.findById(params.id);
    if (!craftlandCode) {
      return NextResponse.json({ error: 'Craftland code not found' }, { status: 404 });
    }

    await craftlandCode.addReport(session.user.id, validatedData);

    return NextResponse.json({ 
      success: true, 
      message: 'Report submitted successfully',
      reportCount: craftlandCode.reportCount
    });

  } catch (error: any) {
    console.error('Error submitting report:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    if (error.message === 'You have already reported this code') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
} 