import React from 'react';
import { FaPlus, FaList, FaChartBar } from 'react-icons/fa';
import Link from 'next/link';

const tabs = [
  { href: '/admin/craftland-codes', label: 'All Codes', icon: FaList },
  { href: '/admin/craftland-codes/new', label: 'Add New', icon: FaPlus },
  { href: '/admin/craftland-codes/stats', label: 'Statistics', icon: FaChartBar },
];

export default function CraftlandCodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Craftland Codes</h1>
        <nav className="flex items-center gap-2">
          {tabs.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-primary/10 text-white transition"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
} 