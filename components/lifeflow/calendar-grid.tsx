'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  date: string;
  title: string;
  time: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

interface CalendarGridProps {
  tasks: Task[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
}

const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export function CalendarGrid({
  tasks,
  selectedDate,
  onSelectDate,
  onNavigateMonth,
}: CalendarGridProps) {
  const currentDate = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Adjust to start from Monday (0 = Monday)
  let startingDayOfWeek = firstDay.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((task) => task.date === dateStr);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const monthName = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="glass p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateMonth('prev')}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => onNavigateMonth('next')}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-white/60 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dayTasks = getTasksForDate(date);
          const today = isToday(date);
          const selected = isSelected(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl p-2 transition-all duration-300 relative group ${
                selected
                  ? 'bg-gradient-purple-pink ring-2 ring-purple-500/50'
                  : today
                    ? 'bg-white/5 ring-2 ring-purple-500/30'
                    : 'hover:bg-white/5'
              }`}
            >
              {/* Current day purple gradient circle */}
              {today && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 -z-10" />
              )}

              {/* Date number */}
              <span className={`text-sm font-semibold z-10 ${today ? 'text-purple-300' : ''}`}>
                {date.getDate()}
              </span>

              {/* Task indicators */}
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1 z-10">
                  {dayTasks.slice(0, 3).map((task, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-xs text-white/50 ml-0.5">+{dayTasks.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
