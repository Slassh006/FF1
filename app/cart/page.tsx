'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaShoppingCart, FaTrash, FaSpinner, FaCoins, FaPlus, FaMinus, FaExclamationTriangle } from 'react-icons/fa';

// Define the expected structure from GET /api/cart
interface PopulatedCartItem {
    _id: string; // StoreItem ID
    itemId: string;
    quantity: number;
    addedAt: Date;
    name: string;
    imageUrl?: string;
    coinCost: number;
    inventory: number | null;
    isActive: boolean;
    category: string;
    lineTotal: number;
    itemExists: boolean;
}

interface CartData {
    items: PopulatedCartItem[];
    totalCost: number;
}

export default function CartPage() {
    const { data: session, status: sessionStatus, update } = useSession();
    const [cartData, setCartData] = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/profile/cart');
            if (response.status === 401) {
                toast.error('Please login to view your cart.');
                // Optionally redirect to login
                // router.push('/login?callbackUrl=/cart'); 
                setCartData({ items: [], totalCost: 0 }); // Show empty cart for logged-out users
                return; 
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch cart');
            }
            const data: CartData = await response.json();
            setCartData(data);
        } catch (error) {
            console.error('Error fetching cart:', error);
            toast.error(error instanceof Error ? error.message : 'Could not load cart');
            setCartData({ items: [], totalCost: 0 }); // Set empty cart on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch cart only when session status is known and authenticated
        if (sessionStatus === 'authenticated') {
            fetchCart();
        } else if (sessionStatus === 'unauthenticated') {
            setLoading(false);
            setCartData({ items: [], totalCost: 0 }); // Show empty cart if not logged in
            toast.error('Login to view your cart.');
        }
        // If sessionStatus is 'loading', the loading state will be handled by the main loading check

    }, [sessionStatus]); // Re-fetch if session status changes

    // --- Placeholder Handlers --- 
    const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
        if (!cartData) return;

        // Validate the update
        const item = cartData.items.find(item => item.itemId === itemId);
        if (!item) {
            toast.error('Item not found in cart');
            return;
        }

        // Check if quantity is valid
        if (newQuantity < 1) {
            toast.error('Quantity must be at least 1');
            return;
        }

        // Check if quantity exceeds inventory
        if (item.inventory !== null && newQuantity > item.inventory) {
            toast.error(`Only ${item.inventory} items available in stock`);
            return;
        }

        // Optimistic update
        const originalCart = { ...cartData };
        setCartData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                items: prev.items.map(item => 
                    item.itemId === itemId 
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            };
        });

        try {
            const response = await fetch('/api/profile/cart', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    itemId,
                    quantity: newQuantity
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update cart');
            }

            const result = await response.json();
            toast.success('Cart updated successfully');
        } catch (error) {
            console.error('Error updating cart:', error);
            toast.error('Failed to update cart');
            // Rollback on error
            setCartData(originalCart);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!cartData) return; // Should not happen if button is visible

        // Find item name for toast message before removing
        const itemToRemove = cartData.items.find(i => i.itemId === itemId);
        const itemName = itemToRemove?.name || 'Item';

        // Optimistic UI Update
        const originalCartData = { ...cartData }; // Store original state for rollback
        const updatedItems = cartData.items.filter(item => item.itemId !== itemId);
        const updatedTotalCost = updatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
        setCartData({ items: updatedItems, totalCost: updatedTotalCost });
        setUpdatingItemId(itemId); // Show spinner on the (now hidden) item row

        try {
            const response = await fetch('/api/profile/cart', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId: itemId }),
            });

            let result;
            try {
                const text = await response.text(); // First get the response as text
                result = text ? JSON.parse(text) : {}; // Only parse if there's content
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                throw new Error(result?.error || 'Failed to remove item');
            }

            toast.success(`${itemName} removed from cart.`);
            // Refresh cart to ensure sync with server
            await fetchCart();

        } catch (error) {
            console.error('Error removing item:', error);
            toast.error(error instanceof Error ? error.message : 'Could not remove item');
            // Rollback UI on error
            setCartData(originalCartData);
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleCheckout = async () => {
        if (!cartData || cartData.items.length === 0 || cartData.items.some(item => !item.itemExists)) {
            toast.error('Cannot checkout with an empty or invalid cart.');
            return;
        }

        setIsCheckingOut(true);
        console.log('Proceeding to checkout...');
        
        try {
            const response = await fetch('/api/profile/cart/checkout', {
                method: 'POST',
                // No body needed, API fetches cart server-side
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Checkout failed. Please try again.');
            }

            // Checkout successful!
            toast.success(result.message || 'Checkout successful!');
            console.log('Order ID:', result.orderId);
            
            // Update the session to reflect the new coin balance BEFORE redirecting
            await update();
            
            // Redirect to profile page (or orders page later)
            // Use next/navigation for redirection
            window.location.href = '/profile'; // Simple redirect for now
            // Or: import { useRouter } from 'next/navigation'; const router = useRouter(); router.push('/profile/orders');
            
            // Optionally, clear local cart state if needed, though page redirect handles it
            // setCartData({ items: [], totalCost: 0 }); 

        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error instanceof Error ? error.message : 'An unexpected error occurred during checkout.');
            setIsCheckingOut(false); // Ensure loading state is reset on error
        } 
        // No finally block needed for setIsCheckingOut(false) because successful checkout redirects away.
    };
    // --- End Placeholder Handlers ---

    // Loading state for session or cart data
    if (loading || sessionStatus === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <FaSpinner className="animate-spin text-blue-500 text-4xl" />
            </div>
        );
    }

    // Handle case where cart data hasn't loaded yet (should be brief)
    if (!cartData) {
         return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <p className="text-gray-400">Initializing cart...</p>
            </div>
        );
    }

    // Main Cart Display
    return (
        <div className="container mx-auto px-4 py-12 min-h-[calc(100vh-10rem)]">
            <h1 className="text-3xl font-bold text-white mb-8">Your Shopping Cart</h1>

            {cartData.items.length === 0 ? (
                <div className="text-center text-gray-400 py-16 bg-gray-800 rounded-lg shadow-lg">
                    <FaShoppingCart className="mx-auto text-6xl text-gray-600 mb-4" />
                    <p className="text-xl mb-2">Your cart is empty.</p>
                    <Link href="/store">
                         <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Go Shopping
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items List (Left/Main Column) */}
                    <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold text-white mb-6">Items</h2>
                         <ul className="space-y-6">
                             {cartData.items.map((item) => (
                                <li key={item.itemId} className={`flex items-center gap-4 p-4 rounded-md border ${!item.itemExists ? 'border-red-600 bg-red-900/20 opacity-70' : 'border-gray-700'}`}>
                                    {/* Image */}
                                    <div className="flex-shrink-0">
                                         <Image 
                                            src={item.imageUrl || '/placeholder-image.png'} 
                                            alt={item.name}
                                            width={64} 
                                            height={64} 
                                            className="rounded object-cover border border-gray-600"
                                            onError={(e) => (e.currentTarget.src = '/placeholder-image.png')} 
                                        />
                                    </div>
                                     {/* Details */}
                                    <div className="flex-grow">
                                         <h3 className={`font-semibold ${!item.itemExists ? 'text-red-400 line-through' : 'text-white'}`}>{item.name}</h3>
                                         <p className="text-sm text-gray-400">{item.category}</p>
                                         <div className="flex items-center text-yellow-400 text-sm mt-1">
                                             <FaCoins className="mr-1"/> 
                                             <span>{item.coinCost} each</span>
                                        </div>
                                        {!item.itemExists && (
                                            <p className="text-xs text-red-400 mt-1 flex items-center"><FaExclamationTriangle className="mr-1"/> Item unavailable</p>
                                        )}
                                    </div>
                                    {/* Quantity Controls */}
                                     <div className="flex items-center gap-2 border border-gray-600 rounded">
                                         <button 
                                            onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                                            disabled={updatingItemId === item.itemId || !item.itemExists} 
                                            className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-50"
                                            aria-label="Decrease quantity"
                                         >
                                            <FaMinus size={12}/>
                                        </button>
                                         <span className="px-2 text-white font-medium min-w-[2ch] text-center">{item.quantity}</span>
                                         <button 
                                            onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                                            disabled={updatingItemId === item.itemId || !item.itemExists || (item.inventory !== null && item.quantity >= item.inventory)}
                                            className="px-2 py-1 text-gray-400 hover:text-white disabled:opacity-50"
                                            aria-label="Increase quantity"
                                         >
                                            <FaPlus size={12}/>
                                        </button>
                                     </div>
                                    {/* Line Total */}
                                     <div className="text-right min-w-[80px]">
                                        <div className="flex items-center justify-end text-yellow-400">
                                            <FaCoins className="mr-1"/> 
                                             <span className="font-semibold text-white">{item.lineTotal}</span>
                                        </div>
                                    </div>
                                     {/* Remove Button */}
                                    <button 
                                        onClick={() => handleRemoveItem(item.itemId)} 
                                        disabled={updatingItemId === item.itemId} 
                                        className="text-gray-500 hover:text-red-500 disabled:opacity-50 ml-2"
                                        aria-label={`Remove ${item.name}`}
                                    >
                                         {updatingItemId === item.itemId ? <FaSpinner className="animate-spin"/> : <FaTrash />}
                                     </button>
                                </li>
                             ))}
                         </ul>
                    </div>

                    {/* Cart Summary (Right Column) */}
                     <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg h-fit sticky top-20">
                        <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-3">Cart Summary</h2>
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-300">
                                <span>Subtotal</span>
                                <span className="flex items-center"><FaCoins className="text-yellow-400 mr-1"/> {cartData.totalCost}</span>
                            </div>
                             {/* Add potential discounts or shipping later if needed */}
                            <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-4">
                                <span>Total</span>
                                 <span className="flex items-center"><FaCoins className="text-yellow-400 mr-1"/> {cartData.totalCost}</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            disabled={isCheckingOut || cartData.items.length === 0 || cartData.items.some(item => !item.itemExists)}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center"
                        >
                            {isCheckingOut ? (
                                <FaSpinner className="animate-spin mr-2" />
                            ) : null}
                            {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                        </button>
                         {cartData.items.some(item => !item.itemExists) && (
                            <p className="text-xs text-red-400 text-center mt-3">Please remove unavailable items before checkout.</p>
                        )}
                     </div>
                </div>
            )}
        </div>
    );
} 