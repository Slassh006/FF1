'use client';

import React, { useState, useEffect, createContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  FaNewspaper, 
  FaImages, 
  FaGift, 
  FaMap, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaUsers,
  FaChartBar,
  FaCog,
  FaBell,
  FaStore,
  FaComments,
  FaQuestionCircle,
  FaHistory,
  FaMoon,
  FaSun,
  FaEnvelopeOpenText,
  FaPaperPlane,
  FaFileAlt,
  FaPhotoVideo
} from 'react-icons/fa';
import { cache } from 'react';
import { create } from 'zustand';

const menuItems = [
  { icon: FaHome, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: FaNewspaper, label: 'Blog Posts', href: '/admin/blogs' },
  { icon: FaImages, label: 'Wallpapers', href: '/admin/wallpapers' },
  { icon: FaPhotoVideo, label: 'Media Gallery', href: '/admin/media' },
  { icon: FaGift, label: 'Redeem Codes', href: '/admin/redeem-codes' },
  { icon: FaMap, label: 'Craftland Codes', href: '/admin/craftland-codes' },
  { icon: FaUsers, label: 'Users', href: '/admin/users' },
  { icon: FaStore, label: 'Store', href: '/admin/store' },
  { icon: FaComments, label: 'Comments', href: '/admin/comments' },
  { icon: FaQuestionCircle, label: 'Quiz Manager', href: '/admin/quiz' },
  { icon: FaChartBar, label: 'Analytics', href: '/admin/analytics' },
  { icon: FaBell, label: 'Notifications', href: '/admin/notifications' },
  { icon: FaEnvelopeOpenText, label: 'Mail Templates', href: '/admin/mail-templates' },
  { icon: FaPaperPlane, label: 'Send Mail', href: '/admin/send-mail' },
  { icon: FaHistory, label: 'Audit Logs', href: '/admin/audit-logs' },
  { icon: FaCog, label: 'Settings', href: '/admin/settings' },
];

export const getStoreItems = cache(async () => {
  // ... existing fetch logic
});

// Add a context to provide theme setter to children
export const AdminThemeContext = createContext<{
  theme: string;
  setTheme: (theme: string) => void;
}>({
  theme: 'default',
  setTheme: () => {}
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setThemeState] = useState('default');
  
  // Check authentication on mount
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      router.push('/login');
    }
  }, [session, status, router]);
  
  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(false);
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Persist sidebar collapsed state
  useEffect(() => {
    const stored = localStorage.getItem('adminSidebarCollapsed');
    if (stored) setIsSidebarCollapsed(stored === 'true');
  }, []);
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  
  // Theme management
  useEffect(() => {
    const stored = localStorage.getItem('adminTheme');
    const initialTheme = stored || 'default';
    setThemeState(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('adminTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme }}>
      <div className="min-h-screen flex bg-dark">
        {/* Sidebar Overlay for Mobile */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full z-50
            bg-secondary text-white border-none
            transition-all duration-300 ease-in-out
            ${isMobile
              ? `w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : isSidebarCollapsed
                ? 'w-16'
                : 'w-64'}
          `}
        >
          <div className="flex items-center justify-between p-4">
            <h1 className={`text-xl font-bold transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>Admin Panel</h1>
            <button
              onClick={toggleSidebar}
              className="text-white hover:text-primary focus:outline-none"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isMobile ? (
                isSidebarOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />
              ) : (
                isSidebarCollapsed ? <FaBars className="w-6 h-6" /> : <FaTimes className="w-6 h-6" />
              )}
            </button>
          </div>
          <nav className="mt-4 h-[calc(100vh-8rem)] overflow-y-auto flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                  className={`
                    group flex items-center px-4 py-3 rounded-lg transition-colors
                    ${isActive ? 'bg-primary/20 text-primary border-l-4 border-primary' : 'text-gray-300 hover:bg-primary/10'}
                    ${isSidebarCollapsed ? 'justify-center px-2' : ''}
                  `}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span
                    className={`ml-3 transition-all duration-200 origin-left ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}
                    style={{ display: isSidebarCollapsed ? 'none' : 'inline' }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        {/* Main Content + Header */}
        <div className={`flex-1 min-h-screen bg-dark transition-all duration-300 ${
          isMobile
            ? ''
            : isSidebarCollapsed
              ? 'ml-16'
              : 'ml-64'
        }`}>
          {/* Page Content */}
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </AdminThemeContext.Provider>
  );
}