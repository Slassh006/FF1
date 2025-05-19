'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  FaBars, 
  FaTimes, 
  FaGamepad, FaImage, FaGift, FaCode, FaInfoCircle, FaExclamationTriangle, FaTrophy
} from 'react-icons/fa';
import { useSession } from 'next-auth/react';

import NavbarLogo from './navbar/NavbarLogo';
import DesktopNavLinks from './navbar/DesktopNavLinks';
import UserAuthSection from './navbar/UserAuthSection';
import SearchButtonAndModal from './navbar/SearchButtonAndModal';
import MobileNavMenu from './navbar/MobileNavMenu';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', path: '/', icon: <FaGamepad className="mr-2" /> },
    { name: 'Store', path: '/store', icon: <FaGift className="mr-2" /> },
    { name: 'Blogs', path: '/blogs', icon: <FaGamepad className="mr-2" /> },
    { name: 'Gallery', path: '/gallery', icon: <FaImage className="mr-2" /> },
    { name: 'Redeem Codes', path: '/redeem-codes', icon: <FaGift className="mr-2" /> },
    { name: 'Craftland Codes', path: '/craftland-codes', icon: <FaCode className="mr-2" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <FaTrophy className="mr-2" /> },
    { name: 'About Us', path: '/about-us', icon: <FaInfoCircle className="mr-2" /> },
    { name: 'Disclaimer', path: '/disclaimer', icon: <FaExclamationTriangle className="mr-2" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') {
      return false;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-dark/95 backdrop-blur-sm shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <NavbarLogo />

          <DesktopNavLinks navItems={navItems} isActive={isActive} />

          <div className="flex items-center space-x-2">
            <SearchButtonAndModal />
            <UserAuthSection />
            
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-white/70 hover:text-white hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <FaTimes className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <FaBars className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <MobileNavMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        navItems={navItems} 
        isActive={isActive}
      />

    </nav>
  );
};

export default Navbar; 