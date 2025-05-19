import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import RedeemCode from '@/app/models/RedeemCode';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use getServerSession for authentication
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Find redeem code
    const code = await RedeemCode.findById(params.id).lean();
    
    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Redeem code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      code,
    });
  } catch (error: any) {
    console.error('Error fetching redeem code:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use getServerSession for authentication
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.code || !body.reward || !body.expiryDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: code, reward, and expiryDate are required' },
        { status: 400 }
      );
    }
    
    // Check if code already exists (excluding current code)
    const existingCode = await RedeemCode.findOne({
      _id: { $ne: params.id },
      code: body.code
    });
    
    if (existingCode) {
      return NextResponse.json(
        { success: false, message: 'This code already exists' },
        { status: 400 }
      );
    }
    
    // Update redeem code
    const updatedCode = await RedeemCode.findByIdAndUpdate(
      params.id,
      {
        code: body.code,
        description: body.description || '',
        expiresAt: new Date(body.expiryDate),
        isActive: body.isActive,
        reward: body.reward,
        maxUses: body.maxUses ? parseInt(body.maxUses) : null
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCode) {
      return NextResponse.json(
        { success: false, message: 'Redeem code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      code: updatedCode,
    });
  } catch (error: any) {
    console.error('Error updating redeem code:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
} 