'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaShoppingCart, FaTrash, FaCoins, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Define a type matching the expected API response structure from GET /api/cart
interface PopulatedCartItem { 
  _id: string; // Assuming _id comes from API
  itemId: string;
  quantity: number;
  addedAt?: Date; // Make optional if not always present/needed
  name: string;
  imageUrl?: string;
  coinCost: number;
  inventory?: number | null;
  isActive?: boolean;
  category?: string;
  lineTotal?: number; // Make optional if not always present/needed
  itemExists?: boolean; // Make optional if not always present/needed
}

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  // Use the correct type for state, matching the API response
  const [cartItems, setCartItems] = useState<PopulatedCartItem[]>([]); 
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchCart();
    }
  }, [session]);

  const fetchCart = async () => {
    let response: Response | null = null; // Define response outside try
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      response = await fetch('/api/profile/cart'); 
      
      console.log(`GET /api/profile/cart - Status: ${response.status}`);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMsg = `Failed to fetch cart (Status: ${response.status})`;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                console.error("Could not parse error response JSON:", e);
            }
        } else {
             // Attempt to read response as text if not JSON
             try {
                 const textError = await response.text();
                 console.error("Non-JSON error response text:", textError); 
                 // You might extract info from HTML if needed, but often just the status is enough
             } catch (textErr) { /* Ignore if reading text fails */ }
        }
        throw new Error(errorMsg);
      }
      
      // Only parse JSON if response is ok
      const data = await response.json();
      setCartItems(data.items || []); 
      // Reset error state on success
      setError(null); 

    } catch (error: any) {
      toast.error(error.message || 'Failed to load cart');
      console.error("Fetch Cart Error:", error, "Response object:", response);
      setError(error.message || 'Failed to load cart'); // Set error state for display
      setCartItems([]); // Clear cart items on error
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      // Optionally remove item if quantity drops below 1
      // Or just prevent going below 1 based on UI interaction
      // For now, just return to prevent invalid quantity update
      return; 
    }

    try {
      // CORRECTED: Use PUT method and the correct API route under /profile/
      const response = await fetch(`/api/profile/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to update quantity';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch(e) { /* Ignore */ }
        throw new Error(errorMsg);
      }

      // If PUT is successful, refetch cart state
      await fetchCart();
      // Toast success is optional, might be too noisy
      // toast.success('Cart updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update quantity');
      console.error("Update quantity error:", error);
    }
  };

  const removeItem = async (itemId: string) => {
    let response: Response | null = null; // Define response outside try block
    try {
      response = await fetch(`/api/profile/cart/${itemId}`, {
        method: 'DELETE',
      });

      console.log(`DELETE /api/profile/cart/${itemId} - Status: ${response.status}`);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

      // Check if the request failed based on status code
      if (!response.ok) {
        let errorMsg = `Failed to remove item (Status: ${response.status})`;
        // Check content type before trying to parse JSON error
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
          } catch(e) { 
              console.error("Could not parse error response JSON:", e);
           }
        }
        throw new Error(errorMsg);
      }

      // If response.ok is true, the backend *should* have succeeded.
      // We don't strictly *need* to parse the success response body ({success:true, message:..})
      // unless we use the data it contains. Parsing it might still cause the JSON error if
      // the response is unexpectedly empty or malformed despite a 2xx status.
      console.log("Item removal request successful (status OK).");
      
      // Proceed to update UI regardless of whether success body parsing works
      await fetchCart(); 
      toast.success('Item removed from cart');

    } catch (error: any) {
      // Catch errors from fetch() itself or the thrown new Error()
      toast.error(error.message || 'Failed to remove item');
      // Log the response object if available for more context
      console.error("Remove item processing error:", error, "Response object:", response);
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      // CORRECTED: Call the new checkout API endpoint path
      const response = await fetch('/api/profile/cart/checkout', { // Use /api/profile/cart/checkout path
        method: 'POST',
        // No body needed if the backend reads cart from the user session
      });

      if (!response.ok) {
        let errorMsg = `Checkout failed (Status: ${response.status})`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch(e) { 
            console.error("Could not parse error response JSON:", e);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json(); 
      
      if (!data.success || !data.orderId) {
          throw new Error('Checkout succeeded but no Order ID was returned.');
      }

      toast.success('Order placed successfully!');
      setCartItems([]); 
      router.push(`/profile/orders/${data.orderId}`); 

    } catch (error: any) {
      toast.error(error.message || 'Failed to checkout');
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const calculateTotal = () => {
    // Access coinCost directly from the flat item structure
    return cartItems.reduce((total, item) => {
      // Add check for item existence/activity if necessary, based on API response
      if (item.itemExists === false) return total; // Don't include non-existent items
      return total + (item.coinCost * item.quantity);
    }, 0);
  };

  if (error) {
      return (
          <div className="p-6 bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center">
            <FaExclamationTriangle className="mr-3" /> Error loading cart: {error}
          </div>
      );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <div className="flex items-center space-x-2">
          <FaShoppingCart className="text-blue-500" />
          <span className="text-gray-400">{cartItems.length} items</span>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <FaShoppingCart className="text-4xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-4">Add some items to your cart to get started</p>
          <button
            onClick={() => router.push('/store')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              // Use item.itemId or item._id from the flat structure
              <div key={item.itemId || item._id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                    <img
                      src={item.imageUrl || '/placeholder-image.png'} // Access directly
                      alt={item.name || 'Cart item'} // Access directly
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = '/placeholder-image.png')}
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.name}</h3> {/* Access directly */} 
                    <p className="text-sm text-gray-400 capitalize">{item.category || 'Item'}</p> {/* Access directly */}
                    <div className="flex items-center space-x-2 mt-2">
                      {/* Ensure updateQuantity uses item.itemId */}
                      <button
                        onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                        className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
                        // Add disabled logic based on quantity/inventory if needed
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                        className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
                         // Add disabled logic based on inventory if needed
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.coinCost} coins</p> {/* Access directly */}
                    <p className="text-sm text-gray-400">
                      Total: {item.coinCost * item.quantity} coins {/* Access directly */}
                    </p>
                     {/* Ensure removeItem uses item.itemId */}
                    <button
                      onClick={() => removeItem(item.itemId)}
                      className="mt-2 text-red-400 hover:text-red-300 flex items-center space-x-1 text-xs"
                    >
                      <FaTrash className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-800 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>{calculateTotal()} coins</span>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{calculateTotal()} coins</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || cartItems.length === 0 || cartItems.every(item => item.itemExists === false)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaCoins />
                <span>Checkout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 