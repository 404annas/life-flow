'use client';

import { TaskProgressBar } from './task-progress-bar';

interface KanbanTaskCardProps {
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
  onDragStart?: (e: React.DragEvent) => void;
  onDelete?: () => void;
}

const priorityEmoji = {
  urgent: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
};

const priorityColor = {
  urgent: 'border-red-500/50',
  high: 'border-orange-500/50',
  medium: 'border-yellow-500/50',
  low: 'border-green-500/50',
};

export const KanbanTaskCard = ({
  id,
  title,
  description,
  priority,
  dueDate,
  dueTime,
  tags,
  subtaskCompleted,
  subtaskTotal,
  avatar,
  avatarColor,
  onDragStart,
  onDelete,
}: KanbanTaskCardProps) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`glass ${priorityColor[priority]} border group cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-4 space-y-3`}
    >
      {/* Header with Priority and Delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{priorityEmoji[priority]}</span>
          <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1">
            {title}
          </h3>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
          title="Delete task"
        >
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-white/70 line-clamp-2">
          {description}
        </p>
      )}

      {/* Due Date and Time */}
      {(dueDate || dueTime) && (
        <div className="flex items-center gap-2 text-xs text-white/60">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1 4.5 4.5 0 11-4.814 6.98z" />
          </svg>
          {dueDate && <span>{dueDate}</span>}
          {dueTime && <span className="text-white/50">{dueTime}</span>}
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtask Progress */}
      {subtaskTotal && subtaskTotal > 0 && (
        <TaskProgressBar
          completed={subtaskCompleted || 0}
          total={subtaskTotal}
          showLabel={true}
          size="sm"
        />
      )}

      {/* Footer with Avatar */}
      {avatar && (
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div
            className={`w-6 h-6 rounded-full bg-gradient-to-br ${
              avatarColor || 'from-purple-500 to-pink-500'
            } flex items-center justify-center text-xs font-bold text-white`}
          >
            {avatar}
          </div>
          <span className="text-xs text-white/50">ID: {id.slice(0, 4)}</span>
        </div>
      )}
    </div>
  );
};
