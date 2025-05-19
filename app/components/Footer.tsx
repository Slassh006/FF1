'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaDiscord, FaArrowUp } from 'react-icons/fa';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setSubscribeStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Subscription failed');
      }

      setSubscribeStatus('success');
      setEmail('');
    } catch (error) {
      setSubscribeStatus('error');
      setErrorMessage('Failed to subscribe. Please try again later.');
    }
  };

  return (
    <footer className="bg-dark text-white/80" role="contentinfo">
      {/* Scroll to top button */}
      <div className="container mx-auto px-4 relative">
        <button 
          onClick={scrollToTop}
          className="absolute -top-5 right-6 bg-primary hover:bg-primary/80 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Scroll to top"
        >
          <FaArrowUp />
        </button>
      </div>
      
      {/* Main footer content */}
      <div className="container mx-auto px-4 pt-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">TheFreeFireIndia</h2>
            <p className="text-white/60">
              Your ultimate source for Free Fire India updates, wallpapers, redeem codes, and more!
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/freefire.india.official" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="Follow us on Facebook">
                <FaFacebook className="text-xl" />
              </a>
              <a href="https://twitter.com/freefireindia" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="Follow us on Twitter">
                <FaTwitter className="text-xl" />
              </a>
              <a href="https://www.instagram.com/freefireindia.official" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="Follow us on Instagram">
                <FaInstagram className="text-xl" />
              </a>
              <a href="https://www.youtube.com/c/FreeFireIndia" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="Subscribe to our YouTube channel">
                <FaYoutube className="text-xl" />
              </a>
              <a href="https://discord.gg/freefire-india" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-primary transition-colors" aria-label="Join our Discord server">
                <FaDiscord className="text-xl" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <nav>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-white/60 hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/blogs" className="text-white/60 hover:text-primary transition-colors">Blogs</Link>
              </li>
              <li>
                <Link href="/gallery" className="text-white/60 hover:text-primary transition-colors">Wallpapers</Link>
              </li>
              <li>
                <Link href="/redeem-codes" className="text-white/60 hover:text-primary transition-colors">Redeem Codes</Link>
              </li>
              <li>
                <Link href="/craftland-codes" className="text-white/60 hover:text-primary transition-colors">Craftland Codes</Link>
              </li>
            </ul>
          </nav>
          
          {/* Resources */}
          <nav>
            <h3 className="text-white font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about-us" className="text-white/60 hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-white/60 hover:text-primary transition-colors">Disclaimer</Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/60 hover:text-primary transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-white/60 hover:text-primary transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-white/60 hover:text-primary transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </nav>
          
          {/* Newsletter */}
          <div>
            <h3 className="text-white font-bold mb-4">Newsletter</h3>
            <p className="text-white/60 mb-4">
              Subscribe to our newsletter for the latest updates, redeem codes, and more!
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div>
                <label htmlFor="email-input" className="sr-only">Email address</label>
                <input 
                  id="email-input"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address" 
                  className="w-full px-4 py-2 rounded-md bg-secondary border border-primary/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-describedby={errorMessage ? "subscribe-error" : undefined}
                  required
                />
                {errorMessage && (
                  <p id="subscribe-error" className="mt-1 text-red-500 text-sm">{errorMessage}</p>
                )}
              </div>
              <button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={subscribeStatus === 'loading'}
              >
                {subscribeStatus === 'loading' ? 'Subscribing...' : 
                 subscribeStatus === 'success' ? 'Subscribed!' : 
                 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Divider */}
        <hr className="my-6 border-white/10" />
        
        {/* Bottom footer section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} TheFreeFireIndia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 