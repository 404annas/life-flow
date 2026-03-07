'use client';

import React from 'react';

interface DashboardHeaderProps {
  userName?: string;
  greeting?: string;
}

export function DashboardHeader({ userName = 'User', greeting = 'Good Morning' }: DashboardHeaderProps) {
  return (
    <div className="px-4 lg:px-8 pt-8 pb-6 space-y-2 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{greeting}</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Welcome back, <span className="gradient-text">{userName}</span>
          </h2>
        </div>
      </div>
      <p className="text-gray-500 text-sm">Here's what you're working on today</p>
    </div>
  );
}
