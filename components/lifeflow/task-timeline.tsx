'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface Task {
  id: string;
  date: string;
  title: string;
  time: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  completed?: boolean;
}

interface TaskTimelineProps {
  date: Date;
  tasks: Task[];
}

const PRIORITY_COLORS = {
  urgent: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400' },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-400' },
  medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500', text: 'text-yellow-400' },
  low: { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-400' },
};

const PRIORITY_LABELS = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function TaskTimeline({ date, tasks }: TaskTimelineProps) {
  const dateStr = date.toISOString().split('T')[0];
  const dayTasks = tasks.filter((task) => task.date === dateStr);
  
  // Sort tasks by time
  const sortedTasks = [...dayTasks].sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
    const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
    return timeA - timeB;
  });

  const dateDisplay = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-6">Tasks for {dateDisplay}</h3>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/50 text-lg">Nothing scheduled. Enjoy your day! 🌿</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task) => {
            const colors = PRIORITY_COLORS[task.priority];
            return (
              <div
                key={task.id}
                className="flex gap-4 animate-fade-in-up"
              >
                {/* Time label */}
                <div className="w-20 flex-shrink-0 text-sm font-semibold text-white/70 pt-1">
                  {task.time}
                </div>

                {/* Vertical line and connector */}
                <div className="relative pb-4">
                  <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gradient-to-b from-white/30 to-white/10" />
                  
                  {/* Dot */}
                  <div className={`relative z-10 ${colors.text}`}>
                    {task.completed ? (
                      <CheckCircle2 size={20} className="fill-current" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </div>
                </div>

                {/* Task card */}
                <div className={`flex-1 glass-dark rounded-xl p-4 border-l-4 ${colors.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${task.completed ? 'line-through text-white/50' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} border border-current/20`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
