'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { FaFire, FaArrowRight } from 'react-icons/fa';

const Hero = () => {
  return (
    <div className="relative h-screen min-h-[600px] max-h-[800px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Free Fire Background"
          fill
          priority
          className="object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark/70 to-dark"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <FaFire className="inline-block text-5xl text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl font-orbitron"
        >
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">TheFreeFireIndia</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mb-8 text-lg text-white/80 md:text-xl"
        >
          Your ultimate destination for Free Fire India content - latest wallpapers, exclusive redeem codes, game tips, and Craftland maps.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Button 
            variant="primary" 
            size="lg" 
            href="/redeem-codes"
            icon={<FaFire />}
          >
            Latest Redeem Codes
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            href="/gallery"
            icon={<FaArrowRight />}
          >
            Explore Wallpapers
          </Button>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-dark to-transparent"></div>
    </div>
  );
};

export default Hero; 