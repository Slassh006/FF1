'use client';

import React from 'react';
import Link from 'next/link';
import { FaUser, FaTachometerAlt, FaSignOutAlt } from 'react-icons/fa';
import { Session } from 'next-auth'; // Import Session type
import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast'; // Import toast

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface UserDropdownMenuProps {
  session: Session; // Use the imported Session type
  onClose: () => void;
}

// Helper function to get menu items based on user role
const getMenuItemsByRole = (role: string | undefined): MenuItem[] => {
  const items: MenuItem[] = [
    { 
      label: 'My Profile', 
      href: '/profile',
      icon: <FaUser className="mr-2" />
    }
  ];

  if (role === 'admin') {
    items.push({ 
      label: 'Admin Panel', 
      href: '/admin/dashboard',
      icon: <FaTachometerAlt className="mr-2" />
    });
  }

  return items;
};

export default function UserDropdownMenu({ session, onClose }: UserDropdownMenuProps) {
  if (!session?.user) return null; // Should ideally not render if no session

  const handleLogout = async () => {
    const logoutToast = toast.loading('Logging out...'); // Show loading toast
    try {
      await signOut({ redirect: false });
      onClose();
      toast.success('Logged out successfully', { id: logoutToast }); // Update toast on success
      window.location.href = '/'; // Redirect to home after logout
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.', { id: logoutToast }); // Update toast on error
    }
  };

  return (
    <div 
      className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900 ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      <div className="py-1">
        {/* User Info Section */}
        <div className="px-4 py-3 border-b border-gray-700">
          <p className="text-sm text-white font-medium truncate">{session.user.name}</p>
          <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
          <p className="text-xs text-gray-400 capitalize">Role: {session.user.role}</p>
        </div>

        {/* Role-based Menu Items */}
        {getMenuItemsByRole(session.user.role).map((item) => (
          <Link
            key={item.href} // Use href as key
            href={item.href}
            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
            role="menuitem"
            onClick={onClose} // Close menu on click
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {/* Divider */}
        <div className="border-t border-gray-700 my-1"></div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          role="menuitem"
        >
          <FaSignOutAlt className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
} 