'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  date: string;
  title: string;
  time: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  duration?: number; // in minutes
}

interface WeekViewProps {
  tasks: Task[];
  selectedDate: Date;
  onNavigateWeek: (direction: 'prev' | 'next') => void;
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({ tasks, selectedDate, onNavigateWeek }: WeekViewProps) {
  // Get Monday of the week containing selectedDate
  const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const monday = getMonday(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    return day;
  });

  const weekStart = weekDays[0].toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const weekEnd = weekDays[6].toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((task) => task.date === dateStr);
  };

  const getTaskPosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours + minutes / 60) * 100; // 100px per hour
  };

  return (
    <div className="glass p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          Week of {weekStart} - {weekEnd}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateWeek('prev')}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => onNavigateWeek('next')}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week view grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day headers */}
          <div className="flex border-b border-white/10">
            <div className="w-20 flex-shrink-0" />
            {weekDays.map((day) => {
              const isToday =
                day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 min-w-40 p-4 text-center border-l border-white/10 ${
                    isToday ? 'bg-white/5' : ''
                  }`}
                >
                  <div className={`text-sm font-semibold ${isToday ? 'text-purple-400' : 'text-white/70'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-purple-300' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div className="relative" style={{ height: '2400px' }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex border-b border-white/10"
                style={{ height: '100px' }}
              >
                <div className="w-20 flex-shrink-0 flex items-start justify-end pr-3 pt-1 text-xs text-white/50">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="flex-1 min-w-40 border-l border-white/10 relative"
                  />
                ))}
              </div>
            ))}

            {/* Task blocks */}
            {weekDays.map((day, dayIndex) => {
              const dayTasks = getTasksForDate(day);
              return dayTasks.map((task) => {
                const topPercent = getTaskPosition(task.time);
                const duration = task.duration || 60;
                const heightPercent = (duration / 60) * 100;

                return (
                  <div
                    key={task.id}
                    className={`absolute ${PRIORITY_COLORS[task.priority]} rounded-lg p-3 text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-shadow`}
                    style={{
                      left: `calc(${(dayIndex / 7) * 100}% + 80px)`,
                      width: `calc((100% - 80px) / 7)`,
                      top: `${topPercent}px`,
                      height: `${heightPercent}px`,
                      marginLeft: '2px',
                      marginRight: '2px',
                    }}
                  >
                    <div className="truncate">{task.title}</div>
                    <div className="text-xs opacity-80 truncate">{task.time}</div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
