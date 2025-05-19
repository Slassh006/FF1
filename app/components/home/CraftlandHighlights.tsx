'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Section from '../ui/Section';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FaCopy, FaArrowRight, FaStar } from 'react-icons/fa';

// Mock data for development
const CRAFTLAND_CODES = [
  {
    id: '1',
    title: 'Zombie Apocalypse',
    description: 'Survive waves of zombies in this intense survival map',
    code: 'Z49XB7',
    coverImage: 'https://images.unsplash.com/photo-1603852452515-2dc92619acc4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80',
    category: 'Zombie',
    creator: 'FireLord92',
    rating: 4.8,
  },
  {
    id: '2',
    title: 'Sky Parkour Challenge',
    description: 'Test your parkour skills in this vertical climbing challenge',
    code: 'P18KL5',
    coverImage: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2036&q=80',
    category: 'Parkour',
    creator: 'JumpMaster',
    rating: 4.5,
  },
  {
    id: '3',
    title: 'Desert Sniper Arena',
    description: 'One-shot-one-kill sniper showdown in desert terrain',
    code: 'S72YT9',
    coverImage: 'https://images.unsplash.com/photo-1519669417670-11a67ca35586?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80',
    category: 'Sniper Map',
    creator: 'HeadshotPro',
    rating: 4.7,
  },
];

const CraftlandHighlights = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const copyToClipboard = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Section 
      title="Featured Craftland Maps" 
      subtitle="Play these amazing custom maps created by the community"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {CRAFTLAND_CODES.map((craftland) => (
          <Card
            key={craftland.id}
            title={craftland.title}
            description={craftland.description}
            imageUrl={craftland.coverImage}
            badges={[craftland.category]}
            footer={
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FaStar className="text-primary mr-1" />
                    <span className="text-white">{craftland.rating}</span>
                  </div>
                  <span className="text-white/60 text-sm">By {craftland.creator}</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-dark/50 rounded-lg">
                  <span className="text-white font-mono">{craftland.code}</span>
                  <Button
                    variant={copiedId === craftland.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => copyToClipboard(craftland.id, craftland.code)}
                    icon={<FaCopy />}
                  >
                    {copiedId === craftland.id ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            }
          />
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Button 
          variant="secondary" 
          href="/craftland"
          icon={<FaArrowRight />}
        >
          Browse All Maps
        </Button>
      </div>
    </Section>
  );
};

export default CraftlandHighlights; 