'use client';

import React from 'react';
import { Edit2 } from 'lucide-react';

interface ProfileHeaderProps {
  username: string;
  email: string;
  avatar: string;
  level: number;
  xpCurrent: number;
  xpNext: number;
  onEditProfile: () => void;
}

export function ProfileHeader({
  username,
  email,
  avatar,
  level,
  xpCurrent,
  xpNext,
  onEditProfile,
}: ProfileHeaderProps) {
  const xpPercentage = (xpCurrent / xpNext) * 100;

  return (
    <div className="glass p-8 rounded-2xl mb-6 text-center">
      {/* Avatar with Gradient Ring and Online Indicator */}
      <div className="relative inline-block mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-1">
          <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center text-3xl font-bold gradient-text">
            {avatar}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 rounded-full border-2 border-[#0a0a0f]" />
      </div>

      {/* Username and Email */}
      <h1 className="text-2xl font-bold mb-2">{username}</h1>
      <p className="text-gray-400 mb-4">{email}</p>

      {/* Level Badge and Progress */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
          <span>Level {level}</span>
          <span className="text-lg">⚡</span>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {xpCurrent} / {xpNext} XP
        </p>
      </div>

      {/* Edit Profile Button */}
      <button
        onClick={onEditProfile}
        className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Edit2 size={16} />
        Edit Profile
      </button>
    </div>
  );
}
