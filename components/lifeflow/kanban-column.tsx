'use client';

import { ReactNode, useState } from 'react';
import { KanbanTaskCard } from './kanban-task-card';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string;
  dueTime?: string;
  tags?: string[];
  subtaskCompleted?: number;
  subtaskTotal?: number;
  avatar?: string;
  avatarColor?: string;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  emoji: string;
  tasks: Task[];
  accentColor: string;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onTaskDelete?: (taskId: string) => void;
}

export const KanbanColumn = ({
  id,
  title,
  emoji,
  tasks,
  accentColor,
  onDragOver,
  onDrop,
  onTaskDelete,
}: KanbanColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    onDragOver?.(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop?.(e);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col min-h-[600px] rounded-2xl transition-all duration-200 ${
        isDragOver
          ? 'ring-2 ring-dashed ring-purple-500/50 bg-purple-500/5'
          : `glass bg-white/5 border border-${accentColor}`
      }`}
    >
      {/* Column Header */}
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/70 font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-2">
              <p className="text-sm text-white/50">No tasks yet</p>
              <p className="text-xs text-white/30">Drag tasks here to organize</p>
            </div>
          </div>
        ) : (
          tasks.map(task => (
            <KanbanTaskCard
              key={task.id}
              {...task}
              onDragStart={(e) => {
                e.dataTransfer?.setData('taskId', task.id);
                e.dataTransfer?.setData('sourceColumnId', id);
              }}
              onDelete={() => onTaskDelete?.(task.id)}
            />
          ))
        )}
      </div>

      {/* Column Footer */}
      <div className="px-4 py-3 border-t border-white/10 text-xs text-white/50 text-center">
        {tasks.length === 0 ? 'Empty column' : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
};
