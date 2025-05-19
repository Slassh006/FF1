import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/app/lib/mongodb';
import CraftlandCode from '@/app/models/CraftlandCode';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['resolve', 'dismiss'])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { codeId: string; reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = actionSchema.parse(body);

    await connectDB();

    const craftlandCode = await CraftlandCode.findById(params.codeId);
    if (!craftlandCode) {
      return NextResponse.json({ error: 'Craftland code not found' }, { status: 404 });
    }

    const report = craftlandCode.reports.id(params.reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    report.status = action === 'resolve' ? 'resolved' : 'dismissed';
    craftlandCode.reportCount = craftlandCode.reports.filter(r => r.status === 'pending').length;

    // If all reports are resolved and the code was marked as fraudulent, unmark it
    if (craftlandCode.reportCount === 0 && craftlandCode.isFraudulent) {
      craftlandCode.isFraudulent = false;
    }

    await craftlandCode.save();

    return NextResponse.json({ 
      success: true, 
      message: `Report ${action}ed successfully`,
      reportCount: craftlandCode.reportCount
    });

  } catch (error: any) {
    console.error('Error updating report status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update report status' },
      { status: 500 }
    );
  }
} 