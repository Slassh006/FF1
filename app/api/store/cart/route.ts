import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import StoreItem from '@/models/StoreItem';

// GET /api/store/cart
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .populate('cart.items.itemId')
      .select('cart');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/store/cart
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, quantity = 1 } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if item exists and is available
    const item = await StoreItem.findById(itemId);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.status !== 'active' || item.inventory < quantity) {
      return NextResponse.json(
        { error: 'Item is not available' },
        { status: 400 }
      );
    }

    // Update user's cart
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if item already exists in cart
    const existingItemIndex = user.cart.items.findIndex(
      (cartItem: any) => cartItem.itemId.toString() === itemId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      user.cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      user.cart.items.push({
        itemId,
        quantity,
        addedAt: new Date(),
      });
    }

    await user.save();

    // Return updated cart
    const updatedUser = await User.findById(session.user.id)
      .populate('cart.items.itemId')
      .select('cart');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser.cart);
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/store/cart
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove item from cart
    user.cart.items = user.cart.items.filter(
      (item: any) => item.itemId.toString() !== itemId
    );

    await user.save();

    // Return updated cart
    const updatedUser = await User.findById(session.user.id)
      .populate('cart.items.itemId')
      .select('cart');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser.cart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 