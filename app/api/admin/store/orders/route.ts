import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import StoreOrder from '@/models/StoreOrder';
import { OrderStatus } from '@/app/types/store';

// GET /api/admin/store/orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'user.email': { $regex: search, $options: 'i' } },
        { '_id': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await StoreOrder.find(query)
      .populate('user', 'name email')
      .populate('item', 'name price type')
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching store orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/store/orders/[id]/status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, deliveryStatus, deliveredItem } = await request.json();
    if (!status && !deliveryStatus) {
      return NextResponse.json(
        { error: 'Status or delivery status is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const order = await StoreOrder.findById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (status) {
      if (!Object.values(OrderStatus).includes(status)) {
        return NextResponse.json(
          { error: 'Invalid order status' },
          { status: 400 }
        );
      }
      order.status = status;
    }

    if (deliveryStatus) {
      order.deliveryStatus = deliveryStatus;
      if (deliveryStatus === 'delivered' && deliveredItem) {
        order.metadata = {
          ...order.metadata,
          deliveredItem,
          deliveryDate: new Date()
        };
      }
    }

    await order.save();
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating store order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 