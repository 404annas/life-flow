'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, LogOut, TrendingUp, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AdminSidebarProps {
  currentPage?: string;
}

export function AdminSidebar({ currentPage = 'overview' }: AdminSidebarProps) {
  const router = useRouter();
  const supabase = createClient();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: BarChart3 },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Logged out');
    router.push('/auth/login');
  };

  return (
    <aside className="w-64 h-screen glass-dark rounded-none border-r border-white/10 flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-purple-pink flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <h1 className="gradient-text text-xl font-bold">LifeFlow</h1>
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
                  ? 'bg-gradient-purple-pink/20 text-white border border-purple-500/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
