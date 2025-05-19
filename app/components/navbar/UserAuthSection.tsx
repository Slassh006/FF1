'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaUser, FaSignInAlt, FaUserPlus, FaCoins, FaShoppingCart, FaSpinner, FaBell } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import UserDropdownMenu from './UserDropdownMenu';
import NotifyMailDropdown from './NotifyMailDropdown';

// Define expected response from the new count API
interface CartCountResponse {
    count: number | null;
    error?: string;
}

export default function UserAuthSection() {
  const { data: session, status } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isNotifyDropdownOpen, setIsNotifyDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [loadingCart, setLoadingCart] = useState<boolean>(false);

  // State for Notification/Mail Counts
  const [notificationCount, setNotificationCount] = useState<number | null>(null);
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);

  // Fetch cart count using the new endpoint
  useEffect(() => {
    const fetchCartCount = async () => {
        if (status === 'authenticated') {
            setLoadingCart(true);
            setCartCount(null); // Reset count while loading
            try {
                // CORRECTED: Call the new /api/cart/count endpoint
                const response = await fetch('/api/cart/count'); 
                if (!response.ok) {
                    console.error('Failed to fetch cart count', response.status);
                    // Optionally parse error message if API sends one
                    try {
                        const errData: CartCountResponse = await response.json();
                        if (errData.error) console.error('Cart count error:', errData.error);
                    } catch(e) { /* Ignore parse error */ }
                    setCartCount(null); // Indicate error or unknown count
                    return;
                }
                const data: CartCountResponse = await response.json();
                setCartCount(data.count); // Set count from the API response
            } catch (error) {
                console.error('Error fetching cart count:', error);
                setCartCount(null);
            } finally {
                setLoadingCart(false);
            }
        } else if (status === 'unauthenticated') {
             setCartCount(0); // Set count to 0 if not authenticated
        }
    };

    fetchCartCount();
  }, [status]); // Re-run when authentication status changes

  // --- Poll for Notification Count --- 
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchNotificationCount = async () => {
        if (status === 'authenticated') {
            setLoadingCounts(true);
            try {
                const response = await fetch('/api/notifications/unread-count');
                if (response.ok) {
                    const data = await response.json();
                    setNotificationCount(data.unreadCount ?? 0);
                } else {
                    console.error('Failed to fetch notification count', response.status);
                    setNotificationCount(null); // Indicate error
                }
            } catch (error) {
                console.error('Error fetching notification count:', error);
                setNotificationCount(null);
            } finally {
                 // Only stop loading on initial fetch, not subsequent polls?
                 // Maybe manage separate initial load state if needed
                 setLoadingCounts(false); 
            }
        } else if (status === 'unauthenticated') {
            setNotificationCount(0);
        }
    };

    fetchNotificationCount(); // Initial fetch
    // Start polling every 60 seconds (adjust interval as needed)
    intervalId = setInterval(fetchNotificationCount, 60000); 

    // Cleanup function to clear interval on component unmount or status change
    return () => {
        if (intervalId) clearInterval(intervalId);
    };

  }, [status]); // Re-run when auth status changes

  const toggleUserMenu = () => {
    setIsNotifyDropdownOpen(false);
    setUserMenuOpen(prev => !prev);
  };

  const toggleNotifyDropdown = () => {
    setUserMenuOpen(false);
    setIsNotifyDropdownOpen(prev => !prev);
  };

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setIsNotifyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef, notifyRef]);

  if (status === 'loading') {
    // Placeholder includes space for coins, mail, notify, cart, user
    return (
        <div className="flex items-center space-x-2 md:space-x-3">
             <div className="w-10 h-6 rounded bg-secondary/50 animate-pulse"></div> 
             <div className="w-6 h-6 rounded bg-secondary/50 animate-pulse"></div>
             <div className="w-6 h-6 rounded bg-secondary/50 animate-pulse"></div>
             <div className="w-6 h-6 rounded bg-secondary/50 animate-pulse"></div>
             <div className="w-8 h-8 rounded-full bg-secondary/50 animate-pulse"></div>
        </div>
    );
  }

  if (status === 'authenticated' && session?.user) {
    const userCoins = (session.user as any).coins ?? 0;
    
    return (
      <div className="flex items-center space-x-1.5 md:space-x-2">
        {/* Coin Display - Use theme colors */}
        <div className="hidden md:flex items-center px-2 py-1 bg-secondary/80 rounded-md text-sm">
            <FaCoins className="text-primary mr-1.5" />
            <span className="text-white font-medium">{userCoins}</span>
        </div>
        
        {/* --- Notification Icon --- */} 
        <div className="relative">
             <button 
                onClick={toggleNotifyDropdown} 
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-primary relative"
                aria-label={`Notifications (${notificationCount ?? 0} unread)`}
            >
                 <FaBell className="h-5 w-5" />
                 {/* Notification Count Badge */} 
                 {!loadingCounts && notificationCount !== null && notificationCount > 0 && (
                     <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex items-center justify-center min-w-[18px] h-[18px]">
                         {notificationCount > 99 ? '99+' : notificationCount} 
                     </span>
                 )} 
                 {/* Loading indicator for counts */} 
                 {loadingCounts && (
                    <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-secondary/80 rounded-full flex items-center justify-center">
                         <FaSpinner className="animate-spin text-white text-[10px]"/>
                     </span>
                 )}
            </button>
        </div>
         
        {/* Cart Icon with Count Badge - Use theme colors */}
        <Link href="/cart" className="relative">
            <button 
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-primary relative" // Use theme colors
                aria-label={`Shopping Cart (${cartCount ?? 0} items)`}
            >
                 <FaShoppingCart className="h-5 w-5" />
                 {!loadingCart && cartCount !== null && cartCount > 0 && (
                     <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex items-center justify-center min-w-[18px] h-[18px]"> {/* Use accent for badge */}
                         {cartCount > 99 ? '99+' : cartCount} 
                     </span>
                 )} 
                 {loadingCart && (
                    <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-secondary/80 rounded-full flex items-center justify-center"> {/* Use theme pulse color */}
                         <FaSpinner className="animate-spin text-white text-[10px]"/>
                     </span>
                 )}
            </button>
        </Link>

        {/* User Button and Dropdown - Use theme colors */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleUserMenu}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-primary" // Use theme colors
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            id="user-menu-button"
          >
            <FaUser className="h-5 w-5" />
          </button>

          {userMenuOpen && (
            <UserDropdownMenu session={session} onClose={() => setUserMenuOpen(false)} />
          )}
        </div>

        {/* Render the combined Notify/Mail Dropdown */} 
        {isNotifyDropdownOpen && (
            <div ref={notifyRef}>
                <NotifyMailDropdown onClose={() => setIsNotifyDropdownOpen(false)} />
            </div>
        )}

      </div>
    );
  } else {
    // Not authenticated: Show Login and Register buttons
    return (
      <div className="hidden md:flex items-center space-x-3"> {/* Increased spacing slightly */} 
        {/* Login Button - Subtle text style */}
        <Link href="/login">
          <button className="flex items-center text-sm text-white/70 hover:text-primary transition-colors px-3 py-1.5 rounded-md">
            <FaSignInAlt className="mr-1.5" /> Login
          </button>
        </Link>
         {/* Register Button - Subtle text style */}
        <Link href="/register">
           <button className="flex items-center text-sm text-white/70 hover:text-primary transition-colors px-3 py-1.5 rounded-md">
             <FaUserPlus className="mr-1.5" /> Register
           </button>
        </Link>
      </div>
    );
  }
} 