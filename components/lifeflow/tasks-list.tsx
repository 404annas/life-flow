'use client';

import React from 'react';
import { TaskCard, Task } from './task-card';

interface TasksListProps {
  tasks: Task[];
  onToggle?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onClick?: (taskId: string) => void;
  emptyState?: boolean;
}

export function TasksList({ tasks, onToggle, onDelete, onClick, emptyState }: TasksListProps) {
  if (tasks.length === 0) {
    return (
      <div className="px-4 lg:px-8 py-12 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="glass p-8 rounded-2xl space-y-3">
          <p className="text-2xl font-semibold text-white">No tasks yet</p>
          <p className="text-gray-400">Create a new task to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Your Tasks</h3>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
}
