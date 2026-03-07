'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'purple' | 'pink' | 'blue' | 'green' | 'orange';
}

export function StatCard({
  label,
  value,
  icon,
  color = 'purple',
}: StatCardProps) {
  void color;

  return (
    <div className="flex-shrink-0 min-w-[140px] lg:min-w-auto p-4 rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/[0.07]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs lg:text-sm text-gray-400 mb-1 truncate">{label}</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{value}</p>
        </div>
        {icon && (
          <div className="text-lg lg:text-xl text-gray-300">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
