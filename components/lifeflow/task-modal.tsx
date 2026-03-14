'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export interface NewTaskInput {
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  description?: string;
  dueDate?: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: NewTaskInput) => Promise<void> | void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
  initialTask?: Partial<NewTaskInput>;
  priorityOptions?: Array<NewTaskInput['priority']>;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  mode = 'create',
  initialTask,
  priorityOptions,
}: TaskModalProps) {
  const allowedPriorities = priorityOptions ?? ['low', 'medium', 'high'];
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<NewTaskInput['priority']>('medium');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    setTitle(initialTask?.title ?? '');
    setPriority(initialTask?.priority ?? 'medium');
    setCategory(initialTask?.category ?? '');
    setDescription(initialTask?.description ?? '');
    setDueDate(initialTask?.dueDate ?? '');
  }, [initialTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please Fill Required Fields To Add Task');
      return;
    }

    await onSubmit({
      title: title.trim(),
      priority,
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  const isEdit = mode === 'edit';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-x-0 bottom-0 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 w-full lg:w-[600px] max-h-[90vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl border border-white/15 bg-[#11131b]/95 p-6 lg:p-7 shadow-2xl backdrop-blur-xl animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">{isEdit ? 'Edit Task' : 'New Task'}</h3>
            <p className="mt-1 text-sm text-white/60">
              {isEdit ? 'Update the details below' : 'Capture what needs to get done'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {allowedPriorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                    priority === p
                      ? 'border-blue-400/60 bg-blue-500/20 text-blue-200'
                      : 'border-white/15 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  disabled={isSubmitting}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">Category (optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Work, Personal, Health"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">Details (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note for context"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={isSubmitting}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="mb-2 block text-sm text-gray-400">Due Date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white transition-all focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              disabled={isSubmitting}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
