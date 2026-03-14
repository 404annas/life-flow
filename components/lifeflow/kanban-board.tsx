'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CalendarClock, Pencil, Search, Trash2 } from 'lucide-react';
import { NewTaskInput, TaskModal } from '@/components/lifeflow/task-modal';

type TaskStatus = 'pending' | 'in_progress' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

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

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueDateRaw: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
}

const COLUMN_META: Array<{ id: TaskStatus; title: string; tone: string }> = [
  { id: 'pending', title: 'Pending', tone: 'border-white/15' },
  { id: 'in_progress', title: 'In Progress', tone: 'border-blue-400/30' },
  { id: 'completed', title: 'Completed', tone: 'border-emerald-400/30' },
];

function normalizePriority(priority: string | null): TaskPriority {
  if (priority === 'low' || priority === 'medium' || priority === 'high' || priority === 'urgent') {
    return priority;
  }
  return 'medium';
}

function normalizeStatus(status: string | null): TaskStatus {
  if (status === 'in_progress' || status === 'completed') return status;
  return 'pending';
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return 'No due date';
  const date = new Date(dueDate);
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function priorityClasses(priority: TaskPriority) {
  if (priority === 'urgent') return 'bg-red-500/20 text-red-200 border-red-400/30';
  if (priority === 'high') return 'bg-orange-500/20 text-orange-200 border-orange-400/30';
  if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30';
  return 'bg-green-500/20 text-green-200 border-green-400/30';
}

function mapDbTask(row: DbTaskRow): KanbanTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description?.trim() || 'No details added.',
    dueDate: formatDueDate(row.due_date),
    dueDateRaw: row.due_date,
    priority: normalizePriority(row.priority),
    status: normalizeStatus(row.status),
    category: row.task_tags?.[0]?.tags?.name?.trim() || 'Uncategorized',
  };
}

export const KanbanBoard = () => {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilters, setPriorityFilters] = useState<TaskPriority[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<KanbanTask | null>(null);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);

  useEffect(() => {
    let active = true;
    const resolveUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setCurrentUserId(user?.id ?? null);
      setAuthResolved(true);
    };
    resolveUser();
    return () => {
      active = false;
    };
  }, [supabase]);

  const kanbanQuery = useQuery({
    queryKey: ['kanban-data', currentUserId],
    enabled: authResolved && Boolean(currentUserId),
    queryFn: async () => {
      if (!currentUserId) throw new Error('UNAUTHENTICATED');

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, status, created_at, task_tags(tag_id, tags(name))')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data ?? []) as DbTaskRow[]).map(mapDbTask);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (kanbanQuery.error) toast.error((kanbanQuery.error as Error).message);
  }, [kanbanQuery.error]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`kanban-tasks-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${currentUserId}` },
        () => queryClient.invalidateQueries({ queryKey: ['kanban-data', currentUserId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_tags' },
        () => queryClient.invalidateQueries({ queryKey: ['kanban-data', currentUserId] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tags', filter: `user_id=eq.${currentUserId}` },
        () => queryClient.invalidateQueries({ queryKey: ['kanban-data', currentUserId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient, supabase]);

  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, nextStatus }: { taskId: string; nextStatus: TaskStatus }) => {
      const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kanban-data', currentUserId] });
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
      await queryClient.invalidateQueries({ queryKey: ['kanban-data', currentUserId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: NewTaskInput }) => {
      if (!currentUserId) throw new Error('User session not found');

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description ?? null,
          due_date: updates.dueDate ?? null,
          priority: updates.priority,
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      const { error: clearError } = await supabase.from('task_tags').delete().eq('task_id', taskId);
      if (clearError) throw clearError;

      const category = updates.category?.trim();
      if (!category) return;

      const { data: existingTag, error: existingTagError } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('name', category)
        .limit(1);

      if (existingTagError) throw existingTagError;

      let tagId = existingTag?.[0]?.id;
      if (!tagId) {
        const { data: newTag, error: newTagError } = await supabase
          .from('tags')
          .insert({
            user_id: currentUserId,
            name: category,
            color: '#3b82f6',
          })
          .select('id')
          .single();
        if (newTagError || !newTag) throw new Error(newTagError?.message ?? 'Failed to create category');
        tagId = newTag.id;
      }

      const { error: linkError } = await supabase.from('task_tags').insert({
        task_id: taskId,
        tag_id: tagId,
      });
      if (linkError) throw linkError;
    },
    onSuccess: async () => {
      toast.success('Task updated');
      await queryClient.invalidateQueries({ queryKey: ['kanban-data', currentUserId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredTasks = useMemo(() => {
    const tasks = kanbanQuery.data ?? [];
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority =
        priorityFilters.length === 0 ? true : priorityFilters.includes(task.priority);
      return matchesSearch && matchesPriority;
    });
  }, [kanbanQuery.data, priorityFilters, searchQuery]);

  const tasksByStatus = useMemo(() => {
    return {
      pending: filteredTasks.filter((task) => task.status === 'pending'),
      in_progress: filteredTasks.filter((task) => task.status === 'in_progress'),
      completed: filteredTasks.filter((task) => task.status === 'completed'),
    };
  }, [filteredTasks]);

  const togglePriority = (priority: TaskPriority) => {
    setPriorityFilters((prev) =>
      prev.includes(priority) ? prev.filter((item) => item !== priority) : [...prev, priority]
    );
  };

  const moveTask = (task: KanbanTask, direction: 'left' | 'right') => {
    const order: TaskStatus[] = ['pending', 'in_progress', 'completed'];
    const idx = order.indexOf(task.status);
    const next = direction === 'left' ? order[idx - 1] : order[idx + 1];
    if (!next) return;
    moveTaskMutation.mutate({ taskId: task.id, nextStatus: next });
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    await deleteTaskMutation.mutateAsync(taskToDelete.id);
    setTaskToDelete(null);
  };

  const handleUpdateTask = async (task: NewTaskInput) => {
    if (!editingTask) return;
    await updateTaskMutation.mutateAsync({ taskId: editingTask.id, updates: task });
    setEditingTask(null);
  };

  return (
    <div className="space-y-5 px-4 pb-8 lg:px-6">
      <section className="rounded-2xl border border-white/10 bg-[#11131b] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, details, category"
              className="w-full rounded-xl border border-white/10 bg-[#0f1118] py-2.5 pr-3 pl-9 text-sm text-white placeholder:text-white/35 focus:border-blue-400/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((priority) => (
              <button
                key={priority}
                onClick={() => togglePriority(priority)}
                className={`rounded border px-3 py-1.5 text-xs font-semibold transition-all ${
                  priorityFilters.includes(priority)
                    ? `${priorityClasses(priority)}`
                    : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </section>

      {kanbanQuery.isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
          Loading board...
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {COLUMN_META.map((column) => {
            const columnTasks = tasksByStatus[column.id];
            return (
              <section
                key={column.id}
                className={`self-start overflow-hidden rounded-3xl border ${column.tone} bg-[#11131b] min-h-[220px]`}
              >
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#11131b] px-4 py-3 rounded-t-3xl">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">{column.title}</h3>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">
                    {columnTasks.length}
                  </span>
                </header>

                <div className="max-h-[62vh] space-y-3 overflow-y-auto p-4">
                  {columnTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-center text-xs text-white/45">
                      No tasks in this lane
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <article key={task.id} className="rounded-xl border border-white/10 bg-[#0f1118] p-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                            <p className="mt-1 text-xs text-white/60">{task.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingTask(task)}
                              className="rounded-md border border-blue-400/25 bg-blue-500/10 p-1.5 text-blue-100 hover:bg-blue-500/20"
                              title="Edit task"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setTaskToDelete(task)}
                              className="rounded-md border border-red-400/25 bg-red-500/10 p-1.5 text-red-200 hover:bg-red-500/20"
                              title="Delete task"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${priorityClasses(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                            {task.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-white/55">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock size={12} />
                            {task.dueDate}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveTask(task, 'left')}
                              disabled={task.status === 'pending' || moveTaskMutation.isPending}
                              className="rounded-md border border-white/15 bg-white/5 p-1 disabled:opacity-35"
                              title="Move left"
                            >
                              <ArrowLeft size={12} />
                            </button>
                            <button
                              onClick={() => moveTask(task, 'right')}
                              disabled={task.status === 'completed' || moveTaskMutation.isPending}
                              className="rounded-md border border-white/15 bg-white/5 p-1 disabled:opacity-35"
                              title="Move right"
                            >
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {taskToDelete && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setTaskToDelete(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-[60] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-[#11131b] p-6 shadow-2xl">
            <h4 className="text-lg font-semibold text-white">Delete task?</h4>
            <p className="mt-2 text-sm text-gray-300">
              This will permanently delete <span className="font-medium text-white">{taskToDelete.title}</span>.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTask}
                className="flex-1 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/30"
                disabled={deleteTaskMutation.isPending}
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}

      <TaskModal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdateTask}
        isSubmitting={updateTaskMutation.isPending}
        mode="edit"
        priorityOptions={['urgent', 'high', 'medium', 'low']}
        initialTask={{
          title: editingTask?.title ?? '',
          priority: editingTask?.priority ?? 'medium',
          category: editingTask?.category === 'Uncategorized' ? '' : editingTask?.category ?? '',
          description: editingTask?.description === 'No details added.' ? '' : editingTask?.description ?? '',
          dueDate: editingTask?.dueDateRaw ?? '',
        }}
      />
    </div>
  );
};
