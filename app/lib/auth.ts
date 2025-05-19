// Keep dbConnect only if it's defined here and imported elsewhere
import dbConnect from './dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { cache } from 'react';

// --- REMOVED ALL CONTENT ---
// Kept dbConnect import temporarily, assuming it might be defined/used here.
// If dbConnect is defined in @/lib/dbConnect, this file can likely be deleted entirely.

// Export dbConnect if it was defined here and needed elsewhere
// export { dbConnect }; 

// Define all available permissions
export const PERMISSIONS = {
  BLOGS: {
    READ: 'read:blogs',
    WRITE: 'write:blogs'
  },
  WALLPAPERS: {
    READ: 'read:wallpapers',
    WRITE: 'write:wallpapers'
  },
  USERS: {
    READ: 'read:users',
    WRITE: 'write:users'
  },
  ORDERS: {
    READ: 'read:orders',
    WRITE: 'write:orders'
  },
  SETTINGS: {
    MANAGE: 'manage:settings'
  },
  CRAFTLAND: {
    READ: 'read:craftland-codes',
    WRITE: 'write:craftland-codes',
    MANAGE: 'manage:craftland-codes'
  }
};

// Cached version of getServerSession
export const getServerSessionCached = cache(() => getServerSession(authOptions));

// Helper function to check if user has required permissions
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}

// Helper function to check if user is admin
export function isAdmin(user: any): boolean {
  return user?.role === 'admin' || user?.isAdmin === true;
}

// Helper function to check if user is authenticated
export function isAuthenticated(user: any): boolean {
  return !!user;
}

// Get default admin permissions
export const getDefaultAdminPermissions = (): string[] => {
  return [
    PERMISSIONS.BLOGS.READ,
    PERMISSIONS.BLOGS.WRITE,
    PERMISSIONS.WALLPAPERS.READ,
    PERMISSIONS.WALLPAPERS.WRITE,
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.WRITE,
    PERMISSIONS.ORDERS.READ,
    PERMISSIONS.ORDERS.WRITE,
    PERMISSIONS.SETTINGS.MANAGE,
    PERMISSIONS.CRAFTLAND.READ,
    PERMISSIONS.CRAFTLAND.WRITE,
    PERMISSIONS.CRAFTLAND.MANAGE
  ];
}; 