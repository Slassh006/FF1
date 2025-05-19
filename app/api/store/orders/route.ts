import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import StoreItem from '@/models/StoreItem';
import Order from '@/models/Order';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { IStoreItem } from '@/models/StoreItem';

interface OrderItem {
  item: mongoose.Types.ObjectId;
  quantity: number;
  priceAtPurchase: number;
  type: IStoreItem['type'];
  metadata: IStoreItem['metadata'];
}

// GET /api/store/orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const orders = await Order.find({ user: session.user.id })
      .populate('items.item')
      .sort({ createdAt: -1 });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/store/orders
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user with cart
    const user = await User.findById(session.user.id)
      .populate('cart.items.itemId');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate total amount and validate inventory
    let totalAmount = 0;
    const orderItems: OrderItem[] = [];

    for (const cartItem of user.cart.items) {
      const item = cartItem.itemId as any;
      if (!item || item.status !== 'active' || item.inventory < cartItem.quantity) {
        return NextResponse.json(
          { error: `Item ${item?.name || 'unknown'} is not available` },
          { status: 400 }
        );
      }

      totalAmount += item.price * cartItem.quantity;
      orderItems.push({
        item: item._id,
        quantity: cartItem.quantity,
        priceAtPurchase: item.price,
        type: item.type,
        metadata: item.metadata,
      });
    }

    // Check if user has enough coins
    if (user.coins < totalAmount) {
      return NextResponse.json(
        { error: 'Insufficient coins' },
        { status: 400 }
      );
    }

    // Start transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Create order
      const order = await Order.create({
        user: user._id,
        items: orderItems,
        totalAmount,
        status: 'pending',
        paymentDetails: {
          coinBalanceBefore: user.coins,
          coinBalanceAfter: user.coins - totalAmount,
          transactionId: uuidv4(),
          method: 'coins',
          timestamp: new Date(),
        },
        metadata: {
          redeemCodes: orderItems
            .filter(item => item.type === 'redeem_code')
            .map(item => (item.metadata as any).redeemCode)
            .filter(Boolean),
          voucherInfo: orderItems
            .filter(item => item.type === 'digital_reward')
            .map(item => (item.metadata as any).voucherInfo)
            .filter(Boolean),
        },
      });

      // Update user's coins and clear cart
      user.coins -= totalAmount;
      user.cart.items = [];
      user.orders.push(order._id);
      user.purchaseHistory.push({
        orderId: order._id,
        date: new Date(),
        amount: totalAmount,
        status: 'pending',
      });
      await user.save({ session: dbSession });

      // Update inventory for each item
      for (const cartItem of user.cart.items) {
        const item = cartItem.itemId as any;
        await StoreItem.findByIdAndUpdate(
          item._id,
          {
            $inc: {
              inventory: -cartItem.quantity,
              soldCount: cartItem.quantity,
            },
          },
          { session: dbSession }
        );
      }

      await dbSession.commitTransaction();
      return NextResponse.json(order);
    } catch (error) {
      await dbSession.abortTransaction();
      throw error;
    } finally {
      dbSession.endSession();
    }
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 