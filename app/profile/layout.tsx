'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaStore, FaShoppingCart, FaUserFriends, FaCode, FaCog, FaChartLine } from 'react-icons/fa';

const tabs = [
  { id: 'overview', label: 'Overview', icon: FaUser, href: '/profile' },
  { id: 'orders', label: 'My Orders', icon: FaStore, href: '/profile/orders' },
  { id: 'cart', label: 'My Cart', icon: FaShoppingCart, href: '/profile/cart' },
  { id: 'referrals', label: 'Invite Friends', icon: FaUserFriends, href: '/profile/referrals' },
  { id: 'submissions', label: 'My Submissions', icon: FaCode, href: '/profile/submissions' },
  { id: 'settings', label: 'Settings', icon: FaCog, href: '/profile/settings' },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Add admin dashboard tab for admin users
  const allTabs = session?.user?.role === 'admin' 
    ? [
        ...tabs.slice(0, 1),
        { id: 'dashboard', label: 'Admin Dashboard', icon: FaChartLine, href: '/admin/dashboard' },
        ...tabs.slice(1)
      ]
    : tabs;

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-dark pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="bg-secondary rounded-lg p-4 mb-8">
          <nav className="flex flex-wrap gap-2">
            {allTabs.map(({ id, label, icon: Icon, href }) => (
              <Link
                key={id}
                href={href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition
                  ${pathname === href 
                    ? 'bg-primary text-black' 
                    : 'text-white hover:bg-primary/10'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-secondary rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
} 