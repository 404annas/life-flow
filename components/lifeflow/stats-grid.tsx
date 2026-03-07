'use client';

import React from 'react';
import { CheckCircle2, Flame, Trophy, Target } from 'lucide-react';

interface StatsGridProps {
  totalCompleted: number;
  currentStreak: number;
  bestStreak: number;
  weekTasks: number;
}

export function StatsGrid({
  totalCompleted,
  currentStreak,
  bestStreak,
  weekTasks,
}: StatsGridProps) {
  const stats = [
    {
      icon: CheckCircle2,
      label: 'Total Tasks Completed',
      value: totalCompleted,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: currentStreak,
      suffix: '🔥',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Trophy,
      label: 'Best Streak',
      value: bestStreak,
      suffix: '🏆',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Target,
      label: 'Tasks This Week',
      value: weekTasks,
      color: 'from-blue-500 to-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="glass p-6 rounded-2xl hover:bg-white/15 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex flex-col items-center">
              <div className={`mb-3 p-3 rounded-full bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                <Icon size={24} className={`text-white`} />
              </div>
              <p className="text-xs text-gray-400 text-center mb-2">{stat.label}</p>
              <div className="text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.suffix && <p className="text-lg">{stat.suffix}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
