import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import StoreItem from '@/models/StoreItem';
import { uploadImage } from '@/lib/uploadImage';

// GET /api/admin/store/items/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const item = await StoreItem.findById(params.id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching store item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/store/items/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const updates: any = {};

    // Handle basic fields
    const fields = ['name', 'description', 'price', 'type', 'status', 'inventory'];
    fields.forEach(field => {
      const value = formData.get(field);
      if (value !== null) {
        updates[field] = field === 'price' || field === 'inventory' ? Number(value) : value;
      }
    });

    // Handle metadata
    const type = formData.get('type') as string;
    if (type === 'redeem_code') {
      const redeemCode = formData.get('redeemCode');
      if (redeemCode !== null) {
        updates['metadata.redeemCode'] = redeemCode;
      }
    } else if (type === 'digital_reward') {
      const voucherProvider = formData.get('voucherProvider');
      const voucherCode = formData.get('voucherCode');
      const voucherInstructions = formData.get('voucherInstructions');
      if (voucherProvider !== null || voucherCode !== null || voucherInstructions !== null) {
        updates['metadata.voucherInfo'] = {
          ...(voucherProvider && { provider: voucherProvider }),
          ...(voucherCode && { code: voucherCode }),
          ...(voucherInstructions && { instructions: voucherInstructions }),
        };
      }
    }

    // Handle expiry date
    const expiryDate = formData.get('expiryDate');
    if (expiryDate !== null) {
      updates['metadata.expiryDate'] = new Date(expiryDate as string);
    }

    // Handle image upload
    const image = formData.get('image') as File;
    if (image) {
      updates.image = await uploadImage(image);
    }

    await connectDB();
    const item = await StoreItem.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true }
    );

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating store item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/store/items/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const item = await StoreItem.findByIdAndDelete(params.id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting store item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 