'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/lifeflow/app-layout';
import { QuickAddButton } from '@/components/lifeflow/quick-add-button';
import { NewTaskInput, TaskModal } from '@/components/lifeflow/task-modal';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CalendarClock, Search, Tag } from 'lucide-react';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high';

interface DbTaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  created_at: string | null;
  task_tags?: Array<{
    tags?: { name?: string | null } | null;
  }> | null;
}

interface TasksViewModel {
  id: string;
  title: string;
  description: string;
  dueDateRaw: string | null;
  dueDateLabel: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  createdAtLabel: string;
}

const STATUS_OPTIONS: Array<{ key: 'all' | TaskStatus; label: string }> = [
  { key: 'all', label: 'All Status' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

const PRIORITY_OPTIONS: Array<{ key: 'all' | TaskPriority; label: string }> = [
  { key: 'all', label: 'All Priorities' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

const CATEGORY_STYLES = [
  { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-400/30' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-400/30' },
  { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-400/30' },
  { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-400/30' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-400/30' },
  { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-400/30' },
];

function normalizeStatus(status: string | null): TaskStatus {
  if (status === 'completed' || status === 'in_progress' || status === 'archived') return status;
  return 'pending';
}

function normalizePriority(priority: string | null): TaskPriority {
  if (priority === 'low' || priority === 'medium' || priority === 'high') return priority;
  return 'medium';
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return 'No due date';
  const due = new Date(dueDate);
  return due.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCreatedAt(createdAt: string | null): string {
  if (!createdAt) return 'Unknown';
  const date = new Date(createdAt);
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function getCategoryStyle(category: string) {
  const hash = category
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

function statusClasses(status: TaskStatus) {
  if (status === 'completed') return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25';
  if (status === 'in_progress') return 'bg-blue-500/15 text-blue-300 border-blue-400/25';
  if (status === 'archived') return 'bg-gray-500/15 text-gray-300 border-gray-400/25';
  return 'bg-amber-500/15 text-amber-300 border-amber-400/25';
}

function priorityClasses(priority: TaskPriority) {
  if (priority === 'high') return 'bg-red-500/15 text-red-300 border-red-400/25';
  if (priority === 'medium') return 'bg-yellow-500/15 text-yellow-300 border-yellow-400/25';
  return 'bg-green-500/15 text-green-300 border-green-400/25';
}

function xpForPriority(priority: TaskPriority) {
  if (priority === 'high') return 20;
  if (priority === 'medium') return 12;
  return 8;
}

function mapDbTaskToViewModel(task: DbTaskRow): TasksViewModel {
  const status = normalizeStatus(task.status);
  const categoryName = task.task_tags?.[0]?.tags?.name?.trim() || 'Uncategorized';

  return {
    id: task.id,
    title: task.title,
    description: task.description?.trim() || 'No details added.',
    dueDateRaw: task.due_date,
    dueDateLabel: formatDueDate(task.due_date),
    priority: normalizePriority(task.priority),
    status,
    category: categoryName,
    createdAtLabel: formatCreatedAt(task.created_at),
  };
}

export default function TasksPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | TaskStatus>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | TaskPriority>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: ['tasks-page-data'],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('UNAUTHENTICATED');

      const { data: rows, error } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, status, created_at, task_tags(tag_id, tags(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (rows ?? []).map((row) => mapDbTaskToViewModel(row as DbTaskRow));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (tasksQuery.error instanceof Error && tasksQuery.error.message === 'UNAUTHENTICATED') {
      router.replace('/auth/login');
      return;
    }
    if (tasksQuery.error) {
      toast.error((tasksQuery.error as Error).message);
    }
  }, [tasksQuery.error, router]);

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: NewTaskInput) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error(userError?.message ?? 'User session not found');

      const { data: createdTask, error: createError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTask.title,
          description: newTask.description ?? null,
          due_date: newTask.dueDate ?? null,
          priority: newTask.priority,
          status: 'pending',
        })
        .select('id')
        .single();

      if (createError || !createdTask) throw new Error(createError?.message ?? 'Failed to create task');

      const category = newTask.category?.trim();
      if (!category) return;

      const { data: existingTag, error: existingTagError } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', category)
        .limit(1);

      if (existingTagError) throw existingTagError;

      let tagId = existingTag?.[0]?.id;
      if (!tagId) {
        const { data: newTag, error: newTagError } = await supabase
          .from('tags')
          .insert({
            user_id: user.id,
            name: category,
            color: '#3b82f6',
          })
          .select('id')
          .single();
        if (newTagError || !newTag) throw new Error(newTagError?.message ?? 'Failed to create category');
        tagId = newTag.id;
      }

      const { error: linkError } = await supabase.from('task_tags').insert({
        task_id: createdTask.id,
        tag_id: tagId,
      });
      if (linkError) throw linkError;
    },
    onSuccess: async () => {
      toast.success('Task created');
      await queryClient.invalidateQueries({ queryKey: ['tasks-page-data'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (task: TasksViewModel) => {
      const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('tasks')
        .update({
          status: nextStatus,
          completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', task.id);
      if (error) throw error;

      if (nextStatus === 'completed' && user?.id) {
        const xpValue = xpForPriority(task.priority);
        const { error: xpError } = await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_xp: xpValue,
        });
        if (xpError) throw xpError;

        const { error: streakError } = await supabase.rpc('update_user_streak', {
          p_user_id: user.id,
        });
        if (streakError) throw streakError;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks-page-data'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      await queryClient.invalidateQueries({ queryKey: ['settings-data'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Task deleted');
      await queryClient.invalidateQueries({ queryKey: ['tasks-page-data'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const allTasks = tasksQuery.data ?? [];
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of allTasks) {
      map.set(task.category, (map.get(task.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [allTasks]);

  React.useEffect(() => {
    if (selectedCategory === 'All') return;
    if (!categoryCounts.some((category) => category.name === selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categoryCounts, selectedCategory]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' ? true : task.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' ? true : task.priority === selectedPriority;
      const matchesCategory = selectedCategory === 'All' ? true : task.category === selectedCategory;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [allTasks, searchQuery, selectedStatus, selectedPriority, selectedCategory]);

  const handleCreateTask = async (task: NewTaskInput) => {
    await createTaskMutation.mutateAsync(task);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = allTasks.find((item) => item.id === taskId);
    if (!task) return;
    await toggleTaskMutation.mutateAsync(task);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    await deleteTaskMutation.mutateAsync(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="px-4 lg:px-8 pt-8 pb-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Tasks Workspace</h1>
          <p className="mt-2 text-white/60">Detailed task management with smart filtering and cached loading.</p>
        </div>

        <div className="px-4 lg:px-8 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, details or category"
                  className="w-full rounded-xl border border-white/10 bg-[#0f1118] py-2.5 pr-3 pl-9 text-sm text-white placeholder:text-white/35 focus:border-blue-400/40 focus:outline-none"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'all' | TaskStatus)}
                className="rounded-xl border border-white/10 bg-[#0f1118] px-3 py-2.5 text-sm text-white focus:border-blue-400/40 focus:outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as 'all' | TaskPriority)}
                className="rounded-xl border border-white/10 bg-[#0f1118] px-3 py-2.5 text-sm text-white focus:border-blue-400/40 focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === 'All'
                  ? 'border-white/30 bg-white/15 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              All ({allTasks.length})
            </button>
            {categoryCounts.map((category) => {
              const style = getCategoryStyle(category.name);
              const active = selectedCategory === category.name;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${style.bg} ${style.text} ${
                    active ? `${style.border} ring-1 ring-white/40` : `${style.border} hover:brightness-110`
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 lg:px-8 py-6 pb-28 lg:pb-10">
          {tasksQuery.isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-xl font-semibold text-white">No tasks found</p>
              <p className="mt-2 text-white/60">Try changing filters or add a new task.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredTasks.map((task) => (
                <article key={task.id} className="rounded-2xl border border-white/10 bg-[#11131b] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className={`text-lg font-semibold ${task.status === 'completed' ? 'text-white/50 line-through' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      <p className="mt-1 text-sm text-white/65">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/10"
                      >
                        {task.status === 'completed' ? 'Mark Pending' : 'Mark Done'}
                      </button>
                      <button
                        onClick={() => setPendingDeleteId(task.id)}
                        className="rounded-lg border border-red-400/25 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${statusClasses(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${priorityClasses(task.priority)}`}>
                      {task.priority} priority
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${getCategoryStyle(task.category).bg} ${getCategoryStyle(task.category).text} ${getCategoryStyle(task.category).border}`}>
                      <Tag size={12} className="mr-1 inline" />
                      {task.category}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-white/55 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarClock size={14} />
                      <span>Due: {task.dueDateLabel}</span>
                    </div>
                    <div>
                      <span>Created: {task.createdAtLabel}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <QuickAddButton onClick={() => setIsModalOpen(true)} />
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTask}
          isSubmitting={createTaskMutation.isPending}
        />

        {pendingDeleteId && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setPendingDeleteId(null)} />
            <div className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#11131b] p-6 shadow-2xl">
              <h4 className="text-lg font-semibold text-white">Delete task?</h4>
              <p className="mt-2 text-sm text-white/70">This action cannot be undone.</p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setPendingDeleteId(null)}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-xl border border-red-400/35 bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-100 hover:bg-red-500/30"
                  disabled={deleteTaskMutation.isPending}
                >
                  {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
