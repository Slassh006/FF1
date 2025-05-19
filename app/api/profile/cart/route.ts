import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import User from '@/models/User';
import StoreItemModel from '@/models/StoreItem';
import { connectDB } from '@/lib/db';
import mongoose, { Types } from 'mongoose';

// Define the structure of the populated cart item we want to return (consistent with old GET /api/cart)
interface PopulatedCartItem {
    _id: Types.ObjectId | string; // Allow string for potential transformation
    itemId: Types.ObjectId | string;
    quantity: number;
    addedAt?: Date; // Make optional if not always present/needed
    name: string;
    imageUrl?: string;
    coinCost: number;
    inventory?: number | null;
    isActive?: boolean;
    category?: string;
    lineTotal?: number;
    itemExists?: boolean;
}

// GET /api/profile/cart - Fetch the current user's populated shopping cart
// Replaces the old GET handler and adopts logic from GET /api/cart for consistency
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        await connectDB(); // Use connectDB from this file's imports

        const user = await User.findById(session.user.id)
            .select('cart') 
            .lean();

        if (!user || !user.cart || !user.cart.items || user.cart.items.length === 0) {
            return NextResponse.json({ items: [], totalCost: 0 }); // Return consistent empty cart structure
        }

        const itemIds = user.cart.items.map((item: any) => item.itemId);
        if (itemIds.length === 0) {
             return NextResponse.json({ items: [], totalCost: 0 }); 
        }

        // Fetch the corresponding store items
        const storeItems = await StoreItemModel.find({
            '_id': { $in: itemIds }
        })
        .select('_id name imageUrl coinCost inventory isActive category')
        .lean();

        const storeItemMap = new Map(storeItems.map(item => [item._id.toString(), item]));

        let totalCartCost = 0;
        const populatedItems: PopulatedCartItem[] = []; // Initialize as empty

        for (const cartItem of user.cart.items) {
            const storeItem = storeItemMap.get(cartItem.itemId.toString());

            // --- SAFETY CHECK --- 
            // If the storeItem doesn't exist in the map (e.g., was deleted from store),
            // skip it or handle it gracefully.
            if (!storeItem) {
                console.warn(`Cart item ${cartItem.itemId} refers to a StoreItem that was not found. Skipping.`);
                // Option 1: Skip this item entirely
                continue; 
                // Option 2: Include it with minimal data and itemExists: false
                /*
                populatedItems.push({
                    _id: cartItem.itemId.toString(),
                    itemId: cartItem.itemId.toString(),
                    quantity: cartItem.quantity,
                    addedAt: cartItem.addedAt,
                    name: 'Item not found',
                    imageUrl: '/placeholder-image.png', // Default image
                    coinCost: 0,
                    itemExists: false, // Important flag
                    // other fields as null/default
                });
                continue; // Move to next cart item
                */
            }
            // --- END SAFETY CHECK ---

            // StoreItem exists, proceed with population
            const itemExistsAndActive = !!storeItem.isActive; // Already checked storeItem exists
            const coinCost = storeItem.coinCost ?? 0;
            const lineTotal = itemExistsAndActive ? coinCost * cartItem.quantity : 0;
            
            if (itemExistsAndActive) {
                totalCartCost += lineTotal;
            }

            populatedItems.push({
                _id: storeItem._id.toString(), 
                itemId: cartItem.itemId.toString(),
                quantity: cartItem.quantity,
                addedAt: cartItem.addedAt,
                name: storeItem.name, // Safe to access now
                imageUrl: storeItem.imageUrl,
                coinCost: coinCost,
                inventory: storeItem.inventory ?? null,
                isActive: storeItem.isActive ?? false,
                category: storeItem.category ?? 'Unknown',
                lineTotal: lineTotal,
                itemExists: itemExistsAndActive // Reflects if found AND active
            });
        } // End loop

        return NextResponse.json({
            items: populatedItems, 
            totalCost: totalCartCost
        });

    } catch (error) {
        console.error('[API Profile Cart GET Error]', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cart';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// POST /api/profile/cart - Add item to cart
export async function POST(req: NextRequest) {
  // console.log('--- POST /api/profile/cart --- Received request'); // Removed log
  try {
    const session = await getServerSession(authOptions);
    // console.log('Session Data:', JSON.stringify(session, null, 2)); // Removed log

    if (!session?.user?.id) {
      // console.error('Unauthorized: No session or user ID found.'); // Removed log
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userIdFromSession = session.user.id;
    // console.log(`Attempting to find user with ID from session: ${userIdFromSession}`); // Removed log

    await connectDB();
    // console.log('Database connected.'); // Removed log

    const body = await req.json();
    const { productId, quantity = 1 } = body;
    // console.log(`Request Body: productId=${productId}, quantity=${quantity}`); // Removed log

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        // console.error('Invalid productId:', productId); // Removed log
        return NextResponse.json({ error: 'Product ID is required or invalid' }, { status: 400 });
    }
    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Quantity must be at least 1 and an integer' }, { status: 400 });
    }
    
    let user;
    try {
        user = await User.findById(userIdFromSession);
        // console.log('User.findById result:', user ? `Found user ${user.email}` : 'User NOT found in DB'); // Removed log
    } catch (findError) {
        console.error(`Error during User.findById(${userIdFromSession}):`, findError);
        throw new Error('Database error finding user.'); // Throw generic error
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.cart) {
      user.cart = { items: [] };
    } else if (!Array.isArray(user.cart.items)) {
      user.cart.items = [];
    }

    const existingItemIndex = user.cart.items.findIndex(
      (item: any) => item.itemId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      // TODO: Add inventory check before increasing quantity
      user.cart.items[existingItemIndex].quantity += quantity;
    } else {
      // TODO: Add inventory check before adding new item
      user.cart.items.push({ itemId: new mongoose.Types.ObjectId(productId), quantity, addedAt: new Date() });
    }

    await user.save();
    // console.log(`User ${user.email} cart saved.`); // Removed log

    const newCartCount = user.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return NextResponse.json({ 
      success: true, 
      message: 'Item added/updated in cart',
      cartItemCount: newCartCount
    });

  } catch (error: any) {
    console.error('Cart update error (POST):', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/cart - Remove item from cart
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userIdFromSession = session.user.id;
    
    await connectDB();
    
    const body = await req.json();
    const { itemId } = body;
    
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Item ID is required or invalid' }, { status: 400 });
    }
    
    const user = await User.findById(userIdFromSession);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.cart || !Array.isArray(user.cart.items)) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    
    // Find the item in the cart
    const itemIndex = user.cart.items.findIndex(
      (item: any) => item.itemId.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
    }
    
    // Remove the item from the cart
    user.cart.items.splice(itemIndex, 1);
    
    await user.save();
    
    const newCartCount = user.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Item removed from cart',
      cartItemCount: newCartCount
    });
    
  } catch (error: any) {
    console.error('Cart removal error (DELETE):', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/cart - Update item quantity in cart
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userIdFromSession = session.user.id;
    
    await connectDB();
    
    const body = await req.json();
    const { itemId, quantity } = body;
    
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({ error: 'Item ID is required or invalid' }, { status: 400 });
    }
    
    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Quantity must be at least 1 and an integer' }, { status: 400 });
    }
    
    // Check if the item exists and has enough inventory
    const storeItem = await StoreItemModel.findById(itemId);
    if (!storeItem) {
      return NextResponse.json({ error: 'Item not found in store' }, { status: 404 });
    }
    
    if (!storeItem.isActive) {
      return NextResponse.json({ error: 'Item is not available' }, { status: 400 });
    }
    
    // Check inventory if it exists
    const inventory = storeItem.inventory;
    if (inventory !== null && quantity > inventory) {
      return NextResponse.json({ error: `Only ${inventory} ${storeItem.name}(s) available` }, { status: 400 });
    }
    
    const user = await User.findById(userIdFromSession);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.cart || !Array.isArray(user.cart.items)) {
      user.cart = { items: [] };
    }
    
    // Find the item in the cart
    const itemIndex = user.cart.items.findIndex(
      (item: any) => item.itemId.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
    }
    
    // Update the quantity
    user.cart.items[itemIndex].quantity = quantity;
    
    await user.save();
    
    const newCartCount = user.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cart updated',
      cartItemCount: newCartCount
    });
    
  } catch (error: any) {
    console.error('Cart update error (PUT):', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update cart' },
      { status: 500 }
    );
  }
} 