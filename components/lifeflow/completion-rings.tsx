'use client';

import React from 'react';

interface RingData {
  label: string;
  completed: number;
  total: number;
  color: string;
}

interface CompletionRingsProps {
  rings: RingData[];
}

function ProgressRing({ completed, total, color }: Omit<RingData, 'label'>) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (completed / total) * circumference;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-24 h-24 lg:w-32 lg:h-32" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <p className="text-2xl lg:text-3xl font-bold text-white">{percentage}%</p>
        <p className="text-xs text-gray-400">
          {completed}/{total}
        </p>
      </div>
    </div>
  );
}

export function CompletionRings({ rings }: CompletionRingsProps) {
  return (
    <div className="px-4 lg:px-8 py-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Your Progress</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {rings.map((ring, index) => (
          <div key={index} className="glass p-4 rounded-2xl flex flex-col items-center justify-center">
            <ProgressRing completed={ring.completed} total={ring.total} color={ring.color} />
            <p className="text-sm text-gray-400 mt-3 text-center truncate">{ring.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
