import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db';
import RedeemCode from '@/app/models/RedeemCode';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { reward: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'expired') {
      query.isActive = false;
    }
    
    // Fetch redeem codes
    const codes = await RedeemCode.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await RedeemCode.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      codes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching redeem codes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch redeem codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    // Check if code already exists
    const existingCode = await RedeemCode.findOne({ code: body.code });
    if (existingCode) {
      return NextResponse.json(
        { success: false, message: 'This code already exists' },
        { status: 400 }
      );
    }
    
    // Create redeem code with default values for required fields
    const redeemCode = await RedeemCode.create({
      code: body.code,
      description: body.description || '',
      expiresAt: new Date(body.expiryDate),
      isActive: true,
      reward: body.reward,
      maxUses: body.maxUses || 100,
      usedCount: 0
    });
    
    return NextResponse.json({
      success: true,
      code: redeemCode,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Redeem Code Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    // Validate ID
    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Redeem code ID is required' },
        { status: 400 }
      );
    }
    
    // Find and update redeem code
    const updatedCode = await RedeemCode.findByIdAndUpdate(
      body.id,
      { $set: body },
      { new: true }
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
    console.error('Update Redeem Code Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    
    // Get ID from query parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Redeem code ID is required' },
        { status: 400 }
      );
    }
    
    // Find and delete redeem code
    const deletedCode = await RedeemCode.findByIdAndDelete(id);
    
    if (!deletedCode) {
      return NextResponse.json(
        { success: false, message: 'Redeem code not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Redeem code deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete Redeem Code Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
} 