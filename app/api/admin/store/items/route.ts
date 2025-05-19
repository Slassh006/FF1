import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import StoreItem from '@/models/StoreItem';
import { uploadImage } from '@/lib/uploadImage';

// GET /api/admin/store/items
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query: any = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await StoreItem.find(query).sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching store items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/store/items
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = Number(formData.get('price'));
    const type = formData.get('type') as 'redeem_code' | 'digital_reward';
    const status = formData.get('status') as 'draft' | 'active' | 'expired';
    const inventory = Number(formData.get('inventory'));
    const image = formData.get('image') as File;
    const redeemCode = formData.get('redeemCode') as string;
    const voucherProvider = formData.get('voucherProvider') as string;
    const voucherCode = formData.get('voucherCode') as string;
    const voucherInstructions = formData.get('voucherInstructions') as string;
    const expiryDate = formData.get('expiryDate') as string;

    if (!name || !description || !price || !type || !status || !inventory || !image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upload image
    const imageUrl = await uploadImage(image);

    await connectDB();
    const item = await StoreItem.create({
      name,
      description,
      price,
      type,
      status,
      inventory,
      image: imageUrl,
      metadata: {
        ...(type === 'redeem_code' && { redeemCode }),
        ...(type === 'digital_reward' && {
          voucherInfo: {
            provider: voucherProvider,
            code: voucherCode,
            instructions: voucherInstructions,
          },
        }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating store item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 