import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { StoreItemSchema } from '@/models/StoreItem';
import { OrderSchema } from '@/models/Order';
import { UserSchema } from '@/models/User';
import { ApiResponse, OrderStatus } from '@/app/types/store';

// Initialize models
const StoreItem = mongoose.models.StoreItem || mongoose.model('StoreItem', StoreItemSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = (session.user as any)._id;
    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'User ID not found in session'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { itemId, quantity = 1 } = body;

    if (!itemId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Item ID is required'
        },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Start a transaction
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      // Get the store item and user
      const [storeItem, user] = await Promise.all([
        StoreItem.findById(itemId).session(mongoSession),
        User.findById(userId).session(mongoSession)
      ]);

      if (!storeItem) {
        throw new Error('Item not found');
      }

      if (!storeItem.isAvailable || storeItem.inventory < quantity) {
        throw new Error('Item is not available or insufficient inventory');
      }

      if (!user) {
        throw new Error('User not found');
      }

      const totalCost = storeItem.price * quantity;
      if (user.coins < totalCost) {
        throw new Error('Insufficient coins');
      }

      // Create the order
      const order = new Order({
        user: user._id,
        items: [{
          item: storeItem._id,
          quantity,
          priceAtPurchase: storeItem.price,
          type: storeItem.type
        }],
        totalAmount: totalCost,
        status: OrderStatus.COMPLETED,
        paymentDetails: {
          coinBalanceBefore: user.coins,
          coinBalanceAfter: user.coins - totalCost,
          transactionId: new mongoose.Types.ObjectId().toString(),
          method: 'coins',
          timestamp: new Date()
        }
      });

      // Update user's coin balance
      user.coins -= totalCost;
      
      // Update store item inventory and sold count
      storeItem.inventory -= quantity;
      storeItem.soldCount += quantity;

      // Save all changes
      await Promise.all([
        order.save({ session: mongoSession }),
        user.save({ session: mongoSession }),
        storeItem.save({ session: mongoSession })
      ]);

      // Commit the transaction
      await mongoSession.commitTransaction();

      return NextResponse.json<ApiResponse<{ orderId: string; remainingCoins: number }>>({
        success: true,
        data: {
          orderId: order._id.toString(),
          remainingCoins: user.coins
        },
        message: 'Purchase successful'
      });
    } catch (error) {
      // Abort transaction on error
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  } catch (error) {
    console.error('Purchase failed:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed'
      },
      { status: 400 }
    );
  }
} 