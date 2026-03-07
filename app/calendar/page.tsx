'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/lifeflow/app-layout';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Tag } from 'lucide-react';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface DbTaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: string | null;
  status: string | null;
  task_tags?: Array<{
    tags?: { name?: string | null } | null;
  }> | null;
}

interface CalendarTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  status: string;
  category: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normalizePriority(priority: string | null): TaskPriority {
  if (priority === 'low' || priority === 'medium' || priority === 'high' || priority === 'urgent') {
    return priority;
  }
  return 'medium';
}

function priorityDot(priority: TaskPriority) {
  if (priority === 'urgent') return 'bg-red-400';
  if (priority === 'high') return 'bg-orange-400';
  if (priority === 'medium') return 'bg-yellow-400';
  return 'bg-green-400';
}

function statusBadge(status: string) {
  if (status === 'completed') return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
  if (status === 'in_progress') return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
  if (status === 'archived') return 'bg-gray-500/20 text-gray-200 border-gray-400/30';
  return 'bg-amber-500/20 text-amber-200 border-amber-400/30';
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mapDbTask(row: DbTaskRow): CalendarTask | null {
  if (!row.due_date) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description?.trim() || 'No details added.',
    dueDate: row.due_date,
    dueTime: row.due_time || '',
    priority: normalizePriority(row.priority),
    status: row.status || 'pending',
    category: row.task_tags?.[0]?.tags?.name?.trim() || 'Uncategorized',
  };
}

export default function CalendarPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(ymd(new Date()));

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

  const calendarQuery = useQuery({
    queryKey: ['calendar-data', currentUserId],
    enabled: authResolved && Boolean(currentUserId),
    queryFn: async () => {
      if (!currentUserId) throw new Error('UNAUTHENTICATED');
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, due_time, priority, status, task_tags(tag_id, tags(name))')
        .eq('user_id', currentUserId)
        .order('due_date', { ascending: true })
        .order('due_time', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as DbTaskRow[])
        .map(mapDbTask)
        .filter((task): task is CalendarTask => Boolean(task));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (authResolved && !currentUserId) {
      router.replace('/auth/login');
      return;
    }
    if (calendarQuery.error) {
      toast.error((calendarQuery.error as Error).message);
    }
  }, [authResolved, currentUserId, calendarQuery.error, router]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`calendar-tasks-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${currentUserId}` },
        () => queryClient.invalidateQueries({ queryKey: ['calendar-data', currentUserId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, queryClient, supabase]);

  const tasks = calendarQuery.data ?? [];

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      const key = task.dueDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const selectedDateTasks = useMemo(() => tasksByDate.get(selectedDate) ?? [], [tasksByDate, selectedDate]);

  const monthGrid = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();

    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, key: `empty-start-${i}` });
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(year, month, day), key: `day-${day}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, key: `empty-end-${cells.length}` });
    }
    return cells;
  }, [visibleMonth]);

  const monthTaskCount = useMemo(() => {
    const y = visibleMonth.getFullYear();
    const m = visibleMonth.getMonth();
    return tasks.filter((task) => {
      const date = new Date(task.dueDate);
      return date.getFullYear() === y && date.getMonth() === m;
    }).length;
  }, [tasks, visibleMonth]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="rounded-2xl border border-white/10 bg-[#11131b] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-white lg:text-3xl">Calendar</h1>
                <p className="mt-1 text-sm text-white/60">All tasks are loaded live from your database.</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/75">
                {monthTaskCount} tasks this month
              </span>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <section className="rounded-2xl border border-white/10 bg-[#11131b] p-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() =>
                    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                  className="rounded-lg border border-white/15 bg-white/5 p-2 text-white/80 hover:bg-white/10"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-lg font-semibold text-white">{formatMonthTitle(visibleMonth)}</h2>
                <button
                  onClick={() =>
                    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                  className="rounded-lg border border-white/15 bg-white/5 p-2 text-white/80 hover:bg-white/10"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {DAY_LABELS.map((label) => (
                  <div key={label} className="pb-1 text-center text-xs font-semibold text-white/50">
                    {label}
                  </div>
                ))}

                {monthGrid.map((cell) => {
                  if (!cell.date) {
                    return <div key={cell.key} className="h-20 rounded-xl border border-transparent" />;
                  }
                  const key = ymd(cell.date);
                  const dayTasks = tasksByDate.get(key) ?? [];
                  const isSelected = key === selectedDate;
                  const isToday = key === ymd(new Date());

                  return (
                    <button
                      key={cell.key}
                      onClick={() => setSelectedDate(key)}
                      className={`h-20 rounded-xl border p-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-400/50 bg-blue-500/10'
                          : 'border-white/10 bg-[#0f1118] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isToday ? 'text-blue-300' : 'text-white/85'}`}>
                          {cell.date.getDate()}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {dayTasks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {dayTasks.slice(0, 3).map((task) => (
                            <span key={task.id} className={`h-1.5 w-1.5 rounded-full ${priorityDot(task.priority)}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#11131b] p-4">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-white/70" />
                <h3 className="text-base font-semibold text-white">
                  Tasks for {new Date(selectedDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </h3>
              </div>

              {calendarQuery.isLoading ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">Loading tasks...</div>
              ) : selectedDateTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/55">
                  No tasks on this date.
                </div>
              ) : (
                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {selectedDateTasks.map((task) => (
                    <article key={task.id} className="rounded-xl border border-white/10 bg-[#0f1118] p-3">
                      <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                      <p className="mt-1 text-xs text-white/60">{task.description}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`rounded-full border px-2 py-0.5 ${statusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-white/75">
                          <Tag size={11} className="mr-1 inline" />
                          {task.category}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-white/55">
                        <Clock3 size={12} />
                        <span>{task.dueTime || 'No time set'}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
