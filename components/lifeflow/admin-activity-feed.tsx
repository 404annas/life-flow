'use client';

import React from 'react';
import { UserPlus, CheckCircle, Zap, MessageSquare } from 'lucide-react';

interface Activity {
  id: number;
  icon: React.ReactNode;
  text: string;
  timestamp: string;
  type: 'signup' | 'complete' | 'achievement' | 'message';
}

const mockActivities: Activity[] = [
  {
    id: 1,
    icon: <UserPlus size={18} className="text-blue-400" />,
    text: 'User @sarah_productivity signed up',
    timestamp: '2 minutes ago',
    type: 'signup',
  },
  {
    id: 2,
    icon: <CheckCircle size={18} className="text-green-400" />,
    text: '23 tasks completed in the last hour',
    timestamp: '5 minutes ago',
    type: 'complete',
  },
  {
    id: 3,
    icon: <Zap size={18} className="text-yellow-400" />,
    text: '5 users reached a 30-day streak',
    timestamp: '12 minutes ago',
    type: 'achievement',
  },
  {
    id: 4,
    icon: <MessageSquare size={18} className="text-purple-400" />,
    text: 'New feedback from @alex_dev',
    timestamp: '18 minutes ago',
    type: 'message',
  },
  {
    id: 5,
    icon: <UserPlus size={18} className="text-blue-400" />,
    text: 'User @emma_organizer signed up',
    timestamp: '24 minutes ago',
    type: 'signup',
  },
  {
    id: 6,
    icon: <CheckCircle size={18} className="text-green-400" />,
    text: '156 tasks completed today',
    timestamp: '1 hour ago',
    type: 'complete',
  },
];

export function AdminActivityFeed() {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10 h-fit sticky top-4">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gradient-purple-pink"></div>
        Recent Activity
      </h3>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {mockActivities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4 pb-4 border-b border-white/10 last:border-b-0 last:pb-0">
            {/* Timeline dot and line */}
            <div className="relative flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                {activity.icon}
              </div>
              {index !== mockActivities.length - 1 && (
                <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500/50 to-transparent mt-1"></div>
              )}
            </div>

            {/* Activity content */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm text-white line-clamp-2">{activity.text}</p>
              <p className="text-xs text-white/50 mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button className="w-full mt-4 px-4 py-2 text-sm text-purple-300 hover:text-purple-200 font-medium transition-colors hover:bg-white/5 rounded-lg">
        View all activity
      </button>
    </div>
  );
}
