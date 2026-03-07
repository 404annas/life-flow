'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/lifeflow/app-layout';
import { DashboardHeader } from '@/components/lifeflow/dashboard-header';
import { StatCard } from '@/components/lifeflow/stat-card';
import { QuickAddButton } from '@/components/lifeflow/quick-add-button';
import { NewTaskInput, TaskModal } from '@/components/lifeflow/task-modal';
import { Task, TaskCard } from '@/components/lifeflow/task-card';
import { Zap, Target, Flame, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

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

function normalizeStatus(status: string | null): TaskStatus {
  if (status === 'completed' || status === 'in_progress' || status === 'archived') return status;
  return 'pending';
}

function normalizePriority(priority: string | null): Task['priority'] {
  if (priority === 'low' || priority === 'medium' || priority === 'high') return priority;
  return 'medium';
}

function formatDueDate(dueDate: string | null): string | undefined {
  if (!dueDate) return undefined;
  const due = new Date(dueDate);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.round((dueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Tomorrow';
  if (dayDiff > 1) return `${dayDiff} days`;
  if (dayDiff === -1) return 'Yesterday';
  return `${Math.abs(dayDiff)} days ago`;
}

interface DashboardTask extends Task {
  status: TaskStatus;
}

const CATEGORY_STYLES = [
  { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-400/30' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-400/30' },
  { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-400/30' },
  { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-400/30' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-400/30' },
  { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-400/30' },
];

function getCategoryStyle(category: string) {
  const hash = category
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

function xpForPriority(priority: Task['priority']) {
  if (priority === 'high') return 20;
  if (priority === 'medium') return 12;
  return 8;
}

function mapDbTaskToUiTask(task: DbTaskRow): DashboardTask {
  const status = normalizeStatus(task.status);
  const categoryName = task.task_tags?.[0]?.tags?.name?.trim() || 'Uncategorized';
  return {
    id: task.id,
    title: task.title,
    priority: normalizePriority(task.priority),
    completed: status === 'completed',
    dueDate: formatDueDate(task.due_date),
    category: categoryName,
    status,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [pendingDeleteTask, setPendingDeleteTask] = useState<DashboardTask | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('UNAUTHENTICATED');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();

      const displayName =
        (profile?.full_name && profile.full_name.trim()) ||
        (profile?.username && profile.username.trim()) ||
        (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '') ||
        (typeof user.user_metadata?.username === 'string' ? user.user_metadata.username : '') ||
        'User';

      const { data: taskRows, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, status, created_at, task_tags(tag_id, tags(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const tasks = ((taskRows ?? []) as DbTaskRow[]).map(mapDbTaskToUiTask);
      return { userId: user.id, userName: displayName, tasks };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (dashboardQuery.error instanceof Error && dashboardQuery.error.message === 'UNAUTHENTICATED') {
      router.replace('/auth/login');
      return;
    }
    if (dashboardQuery.error) {
      toast.error((dashboardQuery.error as Error).message);
    }
  }, [dashboardQuery.error, router]);

  useEffect(() => {
    if (dashboardQuery.data?.userName) {
      setUserName(dashboardQuery.data.userName);
    }
  }, [dashboardQuery.data?.userName]);

  const groupedTasks = useMemo(() => {
    const tasks = dashboardQuery.data?.tasks ?? [];
    const map = new Map<string, DashboardTask[]>();

    for (const task of tasks) {
      const key = task.category?.trim() || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }

    return Array.from(map.entries()).map(([category, items]) => ({
      key: category,
      label: category,
      items,
    }));
  }, [dashboardQuery.data?.tasks]);

  const categoryFilters = useMemo(() => {
    const tasks = dashboardQuery.data?.tasks ?? [];
    const map = new Map<string, number>();

    for (const task of tasks) {
      const category = task.category?.trim() || 'Uncategorized';
      map.set(category, (map.get(category) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [dashboardQuery.data?.tasks]);

  useEffect(() => {
    if (selectedCategory === 'All') return;
    const exists = categoryFilters.some((category) => category.name === selectedCategory);
    if (!exists) setSelectedCategory('All');
  }, [categoryFilters, selectedCategory]);

  const toggleTaskMutation = useMutation({
    mutationFn: async (task: DashboardTask) => {
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
      await queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      await queryClient.invalidateQueries({ queryKey: ['settings-data'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Task deleted');
      await queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: NewTaskInput) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(userError?.message ?? 'User session not found');
      }

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

      if (createError || !createdTask) {
        throw new Error(createError?.message ?? 'Failed to create task');
      }

      const category = newTask.category?.trim();
      if (!category) return;

      const { data: existingTags, error: existingTagError } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', category)
        .limit(1);

      if (existingTagError) throw existingTagError;

      let tagId = existingTags?.[0]?.id;

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

        if (newTagError || !newTag) {
          throw new Error(newTagError?.message ?? 'Failed to create category');
        }

        tagId = newTag.id;
      }

      const { error: linkError } = await supabase
        .from('task_tags')
        .insert({
          task_id: createdTask.id,
          tag_id: tagId,
        });

      if (linkError) throw linkError;
    },
    onSuccess: async () => {
      toast.success('Task created');
      await queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleToggleTask = async (taskId: string) => {
    const task = (dashboardQuery.data?.tasks ?? []).find((item) => item.id === taskId);
    if (!task) return;
    await toggleTaskMutation.mutateAsync(task);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = (dashboardQuery.data?.tasks ?? []).find((item) => item.id === taskId);
    if (!task) return;
    setPendingDeleteTask(task);
  };

  const handleConfirmDeleteTask = async () => {
    if (!pendingDeleteTask) return;
    await deleteTaskMutation.mutateAsync(pendingDeleteTask.id);
    setPendingDeleteTask(null);
  };

  const handleAddTask = async (newTask: NewTaskInput) => {
    await createTaskMutation.mutateAsync(newTask);
  };

  const tasks = dashboardQuery.data?.tasks ?? [];
  const visibleTasks =
    selectedCategory === 'All'
      ? tasks
      : tasks.filter((task) => (task.category?.trim() || 'Uncategorized') === selectedCategory);
  const completionFilteredTasks = visibleTasks.filter((task) => {
    if (completionFilter === 'completed') return task.completed;
    if (completionFilter === 'active') return !task.completed;
    return true;
  });
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeTasks = tasks.filter((t) => !t.completed).length;
  const doneToday = tasks.filter((t) => t.completed && t.dueDate === 'Today').length;
  const productivity = Math.min(100, Math.round((completionRate * 0.7) + (doneToday * 6)));

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0a0a0f]">
        <DashboardHeader userName={userName} greeting="Good Morning" />

        <div className="px-4 lg:px-8 py-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Completed"
              value={completedTasks}
              icon={<Zap size={20} />}
              color="blue"
            />
            <StatCard
              label="Completion Rate"
              value={`${completionRate}%`}
              icon={<TrendingUp size={20} />}
              color="blue"
            />
            <StatCard
              label="Open Tasks"
              value={activeTasks}
              icon={<Flame size={20} />}
              color="blue"
            />
            <StatCard
              label="Productivity Score"
              value={productivity}
              icon={<Target size={20} />}
              color="blue"
            />
          </div>
        </div>

        <div className="px-4 lg:px-8 pb-28 lg:pb-10 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Tasks by Category</h3>
            <p className="text-sm text-gray-400">{totalTasks} total</p>
          </div>

          {dashboardQuery.isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400">
              Loading your tasks...
            </div>
          ) : groupedTasks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-xl font-semibold text-white">No tasks yet</p>
              <p className="mt-2 text-gray-400">Add your first task to get started.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCompletionFilter('all')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    completionFilter === 'all'
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCompletionFilter('active')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    completionFilter === 'active'
                      ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setCompletionFilter('completed')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    completionFilter === 'completed'
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Completed
                </button>
              </div>

              <div className="flex flex-wrap gap-2 -mt-1">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === 'All'
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  All ({totalTasks})
                </button>
                {categoryFilters.map((category) => {
                  const style = getCategoryStyle(category.name);
                  const isActive = selectedCategory === category.name;
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${style.bg} ${style.text} ${
                        isActive ? `${style.border} ring-1 ring-white/40` : `${style.border} hover:brightness-110`
                      }`}
                    >
                      {category.name} ({category.count})
                    </button>
                  );
                })}
              </div>

              {completionFilteredTasks.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-lg font-semibold text-white">No tasks in this category</p>
                  <p className="mt-2 text-gray-400">Pick another category or add a new task.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completionFilteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <QuickAddButton onClick={() => setIsModalOpen(true)} />

        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddTask}
          isSubmitting={createTaskMutation.isPending}
        />

        {pendingDeleteTask && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setPendingDeleteTask(null)}
            />
            <div className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#11131b] p-6 shadow-2xl">
              <h4 className="text-lg font-semibold text-white">Delete task?</h4>
              <p className="mt-2 text-sm text-gray-300">
                This will permanently delete <span className="font-medium text-white">{pendingDeleteTask.title}</span>.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setPendingDeleteTask(null)}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteTask}
                  className="flex-1 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/30"
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
