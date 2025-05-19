import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

// Update cart item quantity
export async function PUT(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { itemId } = params;
    const body = await req.json();
    const { quantity } = body;

    // Validate input
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 });
    }

    // Fetch user and update cart item
    const user = await User.findById(session.user.id).select('cart');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure cart and items array exist
    if (!user.cart || !Array.isArray(user.cart.items)) {
         // Or initialize cart: user.cart = { items: [] };
        return NextResponse.json({ error: 'Cart not initialized or item not found' }, { status: 404 });
    }

    // Find the item index within the items array
    const itemIndex = user.cart.items.findIndex(
      (item: any) => item.itemId.toString() === itemId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
    }

    // Update quantity in the items array
    user.cart.items[itemIndex].quantity = quantity;
    // Optionally update addedAt timestamp if needed
    // user.cart.items[itemIndex].addedAt = new Date(); 
    
    await user.save();

    // Return success or updated cart state
    return NextResponse.json({ 
      success: true, 
      message: 'Quantity updated' // Or return updated items like before if needed
    });

  } catch (error: any) {
    console.error('Cart item update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// Remove item from cart
export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { itemId } = params;

    // Validate itemId format if needed (optional but good practice)
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Invalid item ID format' }, { status: 400 });
    }

    // Fetch the user, selecting the cart
    // Use .select('+cart') only if cart is excluded by default in your User model schema
    const user = await User.findById(session.user.id).select('cart'); 
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure cart and items array exist before filtering
    if (user.cart && Array.isArray(user.cart.items)) {
      const initialLength = user.cart.items.length;
      // CORRECTED: Filter the user.cart.items array
      user.cart.items = user.cart.items.filter(
        (item: any) => item.itemId.toString() !== itemId
      );
      
      // Only save if something was actually removed
      if (user.cart.items.length < initialLength) {
         await user.save();
      } else {
          // Optional: Return a different message if item wasn't found in cart
          // return NextResponse.json({ success: true, message: 'Item not found in cart' });
      }

    } else {
      // Cart or items array doesn't exist, nothing to remove
      // You might want to initialize user.cart = { items: [] } here if appropriate
    }

    // Return success, maybe with the updated cart or just a success message
    // Re-fetching the cart on the frontend is often simpler than transforming here
    return NextResponse.json({ 
      success: true, 
      message: 'Item removed successfully' // Modify response as needed
    });

  } catch (error: any) {
    console.error('Cart item removal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove cart item' },
      { status: 500 }
    );
  }
} 