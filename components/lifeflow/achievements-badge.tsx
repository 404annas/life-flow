'use client';

import React from 'react';
import { Lock } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  emoji: string;
  unlocked: boolean;
  description?: string;
}

interface AchievementsBadgeProps {
  achievements: Achievement[];
}

export function AchievementsBadge({ achievements }: AchievementsBadgeProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Achievements</h3>
      <div className="glass p-6 rounded-2xl">
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex-shrink-0 w-24 h-24 snap-center"
            >
              <div
                className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group cursor-pointer ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 hover:from-purple-500/50 hover:to-pink-500/50'
                    : 'bg-white/5 grayscale opacity-60'
                }`}
              >
                <span className="text-3xl">{achievement.emoji}</span>
                {!achievement.unlocked && (
                  <Lock size={12} className="absolute top-1 right-1 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-400 text-center mt-2 truncate max-w-full px-1">
                {achievement.name}
              </p>
              
              {/* Tooltip on hover */}
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {achievement.description || achievement.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
