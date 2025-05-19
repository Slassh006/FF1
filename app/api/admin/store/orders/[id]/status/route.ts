import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import StoreOrder from '@/models/StoreOrder';
import { OrderStatus } from '@/app/types/store';

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
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 