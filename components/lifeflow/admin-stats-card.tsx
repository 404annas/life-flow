'use client';

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  trend: number;
  trendLabel: string;
  sparklineData: Array<{ value: number }>;
  icon: React.ReactNode;
}

export function AdminStatsCard({
  title,
  value,
  trend,
  trendLabel,
  sparklineData,
  icon,
}: AdminStatsCardProps) {
  const isPositive = trend >= 0;

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:bg-white/5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-white/60 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp size={16} className="text-green-400" />
            ) : (
              <TrendingDown size={16} className="text-red-400" />
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {Math.abs(trend)}% {trendLabel}
            </span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-purple-pink/20 flex items-center justify-center text-purple-300">
          {icon}
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-12 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
