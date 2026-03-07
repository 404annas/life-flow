'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, Users, TrendingUp, Settings } from 'lucide-react';

interface AdminSidebarProps {
  currentPage?: string;
}

export function AdminSidebar({ currentPage = 'overview' }: AdminSidebarProps) {
  const navItems = [
    { label: 'Overview', href: '/admin', icon: BarChart3 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen glass-dark rounded-none border-r border-white/10 flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-purple-pink flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <h1 className="gradient-text text-lg font-bold">LifeFlow</h1>
        </div>
        <p className="text-xs text-white/50 mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.label.toLowerCase();
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-purple-pink/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Badge */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-purple-pink flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin</p>
            <div className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/30 text-purple-200 border border-purple-500/50">
              Admin
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
