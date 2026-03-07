'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, CheckSquare, Settings, LogOut, Columns, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Kanban', href: '/kanban', icon: Columns },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="glass-dark rounded-none sticky top-0 z-40 h-16 flex items-center justify-between px-4 lg:px-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="gradient-text text-xl font-bold">LifeFlow</h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogOut size={18} />
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <aside
          className={`fixed left-0 top-16 bottom-0 w-64 glass-dark rounded-none border-r border-white/10 z-40 transform transition-transform lg:static lg:transform-none lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors group"
              >
                <item.icon size={20} className="group-hover:text-purple-400 transition-colors" />
                {item.label}
              </Link>
            ))}
            <hr className="border-white/10 my-4" />
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-red-400 hover:text-red-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogOut size={20} />
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-dark rounded-none border-t border-white/10 flex items-center justify-around lg:hidden z-40">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-4 py-2 text-xs rounded-lg hover:bg-white/10 transition-colors group"
          >
            <item.icon size={24} className="group-hover:text-purple-400 transition-colors" />
            <span className="hidden xs:inline">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
