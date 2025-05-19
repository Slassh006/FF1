'use client';

import React, { useState, useEffect } from 'react';
import Section from '../ui/Section';
import Button from '../ui/Button';
import { FaCopy, FaClock, FaGift } from 'react-icons/fa';

const MOCK_REDEEM_CODE = {
  code: 'FF12-ABCD-XYZ9-QRST',
  description: 'Get 2x Diamond Royale Vouchers and 1x Weapon Royale Voucher',
  reward: 'Diamond & Weapon Vouchers',
  // Set expiry 2 hours from now
  expiresAt: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString(),
};

const RedeemCodeSection = () => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    hours: 2,
    minutes: 0,
    seconds: 0,
  });
  
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const targetDate = new Date(MOCK_REDEEM_CODE.expiresAt).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      
      if (distance <= 0) {
        clearInterval(interval);
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeRemaining({ hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(MOCK_REDEEM_CODE.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section 
      title="Latest Redeem Code" 
      subtitle="Copy the code and redeem it in the Free Fire game for exclusive rewards"
      className="bg-gradient-to-b from-dark to-secondary"
    >
      <div className="max-w-3xl mx-auto">
        <div className="p-6 bg-secondary border border-primary/30 rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <FaGift className="text-primary text-2xl mr-3" />
              <h3 className="text-white text-xl font-bold font-orbitron">Active Redeem Code</h3>
            </div>
            <div className="flex items-center">
              <FaClock className="text-primary mr-2" />
              <div className="text-white font-bold font-orbitron">
                Expires in: 
                <span className="ml-2 text-primary">
                  {String(timeRemaining.hours).padStart(2, '0')}:
                  {String(timeRemaining.minutes).padStart(2, '0')}:
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Code Section */}
          <div className="flex flex-col md:flex-row items-center p-4 bg-dark/70 rounded-lg mb-6">
            <div className="flex-1 mb-4 md:mb-0 md:mr-4 text-center md:text-left">
              <p className="text-white/70 text-sm mb-1">Copy this code:</p>
              <p className="text-primary text-xl font-mono font-bold tracking-wide break-all">
                {MOCK_REDEEM_CODE.code}
              </p>
            </div>
            <Button
              variant={copied ? 'primary' : 'secondary'}
              onClick={copyToClipboard}
              icon={<FaCopy />}
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
          
          {/* Description */}
          <div className="mb-6">
            <h4 className="text-white font-orbitron mb-2">Reward Details:</h4>
            <p className="text-white/70">{MOCK_REDEEM_CODE.description}</p>
          </div>
          
          {/* How to Redeem */}
          <div className="p-4 bg-dark/50 rounded-lg">
            <h4 className="text-white font-orbitron mb-3">How to Redeem:</h4>
            <ol className="text-white/70 list-decimal list-inside space-y-2">
              <li>Visit the official <a href="https://reward.ff.garena.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Free Fire Redemption Site</a></li>
              <li>Log in using your Free Fire account</li>
              <li>Enter the redemption code in the given field</li>
              <li>Click on Confirm and collect your rewards from the in-game mail</li>
            </ol>
          </div>
        </div>
        
        <div className="flex justify-center mt-10">
          <Button 
            variant="primary" 
            href="/redeem-codes"
          >
            View All Redeem Codes
          </Button>
        </div>
      </div>
    </Section>
  );
};

export default RedeemCodeSection; 