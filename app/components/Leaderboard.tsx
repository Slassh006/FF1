'use client';

import React from 'react';
import { FaTrophy, FaMedal, FaAward } from 'react-icons/fa';

interface LeaderboardItem {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  badges?: string[];
}

interface LeaderboardProps {
  title: string;
  items: LeaderboardItem[];
  type: 'contributors' | 'creators' | 'voters';
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <FaTrophy className="text-yellow-400" />;
    case 2:
      return <FaMedal className="text-gray-300" />;
    case 3:
      return <FaAward className="text-amber-600" />;
    default:
      return <span className="text-white/60">{rank}</span>;
  }
};

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case 'verified':
      return 'bg-blue-900/30 text-blue-400';
    case 'top_contributor':
      return 'bg-purple-900/30 text-purple-400';
    case 'early_adopter':
      return 'bg-green-900/30 text-green-400';
    case 'community_leader':
      return 'bg-yellow-900/30 text-yellow-400';
    default:
      return 'bg-gray-900/30 text-gray-400';
  }
};

export default function Leaderboard({ title, items, type }: LeaderboardProps) {
  return (
    <div className="bg-secondary rounded-lg p-6 border border-primary/20">
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.rank}
            className="flex items-center justify-between p-4 bg-dark/50 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center">
                {getRankIcon(item.rank)}
              </div>
              
              <div className="flex items-center gap-3">
                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-lg font-semibold">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div>
                  <h3 className="text-white font-medium">{item.name}</h3>
                  {item.badges && item.badges.length > 0 && (
                    <div className="flex gap-2 mt-1">
                      {item.badges.map((badge) => (
                        <span
                          key={badge}
                          className={`px-2 py-1 rounded-full text-xs ${getBadgeColor(badge)}`}
                        >
                          {badge.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-primary font-semibold">{item.score}</div>
              <div className="text-white/60 text-sm">
                {type === 'contributors' && 'contributions'}
                {type === 'creators' && 'codes created'}
                {type === 'voters' && 'votes cast'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 