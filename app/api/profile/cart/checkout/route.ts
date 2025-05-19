import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User';
import StoreItemModel, { IStoreItem as StoreItemDoc, StoreItemCategory } from '@/models/StoreItem';
import OrderModel from '@/models/Order';
import mongoose, { Types } from 'mongoose';

// Re-define necessary types/enums locally if not exported from model
interface IOrderItem {
  storeItemId: Types.ObjectId | string;
  name: string;
  category: string;
  coinCost: number;
  quantity: number;
  revealedRedeemCode?: string;
  revealedRewardDetails?: string;
}

enum OrderStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
  CANCELLED = 'Cancelled',
}

// POST /api/profile/cart/checkout - Process the user's cart checkout
export async function POST(request: NextRequest) {
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user?.id) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const userId = userSession.user.id;

    try {
        await dbConnect();

        // 1. Fetch User with cart and coins
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found.');
        }
        if (!user.cart || !user.cart.items || user.cart.items.length === 0) {
            throw new Error('Cart is empty.');
        }

        // 2. Fetch Store Item documents based on cart
        const itemIds = user.cart.items.map(item => item.itemId);
        const storeItems: StoreItemDoc[] = await StoreItemModel.find({ 
            '_id': { $in: itemIds } 
        }).lean();
        
        const storeItemMap = new Map<string, StoreItemDoc>();
        for (const item of storeItems) {
            if (item && item._id) {
                storeItemMap.set(item._id.toString(), item);
            }
        }

        // 3. Validate Cart and Calculate Total Cost (Server-Side)
        let calculatedTotalCost = 0;
        const orderItems: IOrderItem[] = [];
        let validationError: string | null = null;

        for (const cartItem of user.cart.items) {
            const storeItem = storeItemMap.get(cartItem.itemId.toString());

            if (!storeItem || !storeItem._id) {
                validationError = `Item ID "${cartItem.itemId}" from cart not found in store.`;
                break;
            }
            if (!storeItem.isActive) {
                validationError = `Item "${storeItem.name}" is currently unavailable.`;
                break;
            }
            const currentInventory = storeItem.inventory ?? null;
            if (currentInventory !== null && currentInventory < cartItem.quantity) {
                validationError = `Insufficient stock for "${storeItem.name}". Available: ${currentInventory}.`;
                break;
            }

            calculatedTotalCost += storeItem.coinCost * cartItem.quantity;

            const orderItemEntry: IOrderItem = {
                storeItemId: storeItem._id.toString(),
                name: storeItem.name,
                category: storeItem.category,
                coinCost: storeItem.coinCost,
                quantity: cartItem.quantity,
            };

            if (storeItem.category === StoreItemCategory.REDEEM_CODE && storeItem.redeemCode) {
                orderItemEntry.revealedRedeemCode = storeItem.redeemCode;
            }
            else if (storeItem.category === StoreItemCategory.DIGITAL_REWARD && storeItem.rewardDetails) {
                orderItemEntry.revealedRewardDetails = storeItem.rewardDetails;
            }

            orderItems.push(orderItemEntry);
        }

        if (validationError) {
            throw new Error(validationError);
        }

        // 4. Validate User Coins
        if (user.coins < calculatedTotalCost) {
            throw new Error(`Insufficient coins. Required: ${calculatedTotalCost}, Available: ${user.coins}.`);
        }

        // 5. Create Order document first
        const newOrder = new OrderModel({
            userId: user._id,
            items: orderItems,
            totalCoinCost: calculatedTotalCost,
            status: OrderStatus.PENDING, // Start with pending
        });
        const savedOrder = await newOrder.save();
        if (!savedOrder?._id) throw new Error('Failed to save order or get order ID.');

        // 6. Update inventory for each item
        // Use updateMany to update all items at once with their respective quantities
        const bulkOps = orderItems.map(orderItem => ({
            updateOne: {
                filter: { 
                    _id: orderItem.storeItemId,
                    $or: [
                        { inventory: null },
                        { inventory: { $gte: orderItem.quantity } }
                    ]
                },
                update: {
                    $inc: { inventory: -orderItem.quantity }
                }
            }
        }));
        
        if (bulkOps.length > 0) {
            const inventoryResult = await StoreItemModel.bulkWrite(bulkOps);
            if (inventoryResult.modifiedCount !== bulkOps.length) {
                // If not all items were updated, something went wrong (like insufficient inventory)
                // Mark order as failed and throw error
                await OrderModel.findByIdAndUpdate(savedOrder._id, { status: OrderStatus.FAILED });
                throw new Error('Failed to update inventory for one or more items. Please try again.');
            }
        }

        // 7. Update user's coins and cart
        const userUpdateResult = await UserModel.findByIdAndUpdate(
            user._id,
            {
                $inc: { coins: -calculatedTotalCost },
                'cart.items': [], // Clear cart
                $push: { orders: savedOrder._id } // Add order reference
            },
            { new: true }
        );

        if (!userUpdateResult) {
            // If user update fails, mark order as failed
            await OrderModel.findByIdAndUpdate(savedOrder._id, { status: OrderStatus.FAILED });
            throw new Error('Failed to update user data. Please try again.');
        }

        // 8. Mark order as completed
        await OrderModel.findByIdAndUpdate(savedOrder._id, { status: OrderStatus.COMPLETED });

        return NextResponse.json({ 
            success: true, 
            message: 'Checkout successful!',
            orderId: savedOrder._id.toString()
        }, { status: 201 });

    } catch (error) {
        console.error('[API Checkout POST Error]', error);
        const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
        let statusCode = 500;
        if (errorMessage === 'Cart is empty.' || 
            errorMessage.startsWith('Insufficient stock') || 
            errorMessage.includes('no longer available') || 
            errorMessage.startsWith('Item ID ') || 
            errorMessage.startsWith('Item "') || 
            errorMessage.startsWith('Insufficient coins')) {
             statusCode = 400; 
        }
        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
} 