'use client';

import React from 'react';
import { CheckCircle2, Circle, Trash2, ChevronRight } from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate?: string;
  category?: string;
}

interface TaskCardProps {
  task: Task;
  onToggle?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onClick?: (taskId: string) => void;
}

const priorityColors = {
  low: 'border-l-green-500 bg-green-500/5',
  medium: 'border-l-yellow-500 bg-yellow-500/5',
  high: 'border-l-red-500 bg-red-500/5',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function TaskCard({ task, onToggle, onDelete, onClick }: TaskCardProps) {
  return (
    <div
      onClick={() => onClick?.(task.id)}
      className={`glass p-4 rounded-xl border-l-4 group cursor-pointer transition-all hover:shadow-lg hover:shadow-black/30 ${
        priorityColors[task.priority]
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(task.id);
          }}
          className="mt-1 text-blue-300 hover:text-blue-200 transition-colors"
        >
          {task.completed ? (
            <CheckCircle2 size={24} />
          ) : (
            <Circle size={24} className="text-gray-500 hover:text-blue-300" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium text-white truncate ${
              task.completed ? 'line-through text-gray-500' : ''
            }`}
          >
            {task.title}
          </h4>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {priorityLabels[task.priority]}
            </span>
            {task.dueDate && (
              <span className="text-xs text-gray-400">{task.dueDate}</span>
            )}
            {task.category && (
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{task.category}</span>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
