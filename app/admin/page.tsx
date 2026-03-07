'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  ListTodo,
  Loader2,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/lifeflow/admin-sidebar'
import { toast } from 'sonner'

interface AdminDashboardResponse {
  metrics: {
    totalUsers: number
    activeToday: number
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    pendingTasks: number
    completionRate: number
  }
  analytics: {
    signups7d: Array<{ label: string; value: number }>
    tasksTrend7d: Array<{ label: string; created: number; completed: number }>
    statusDistribution: Array<{ name: string; value: number }>
  }
  activity: Array<{
    id: string
    type: 'user_joined' | 'task_created' | 'task_completed'
    message: string
    createdAt: string
  }>
  generatedAt: string
}

const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#10b981']

function timeAgo(input: string) {
  const diff = Date.now() - new Date(input).getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return 'just now'
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  return `${Math.floor(diff / day)}d ago`
}

function activityMeta(type: 'user_joined' | 'task_created' | 'task_completed') {
  if (type === 'user_joined') {
    return { icon: <UserPlus size={14} />, badge: 'New User', classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' }
  }
  if (type === 'task_created') {
    return { icon: <ListTodo size={14} />, badge: 'Task Created', classes: 'bg-blue-500/15 text-blue-300 border-blue-400/30' }
  }
  return { icon: <CheckCircle2 size={14} />, badge: 'Task Completed', classes: 'bg-violet-500/15 text-violet-300 border-violet-400/30' }
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: number | string
  subtitle: string
  icon: ReactNode
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#10131c] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-white/55">{subtitle}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/75">{icon}</div>
      </div>
    </article>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131c] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/50">{subtitle}</p>
      </div>
      <div className="h-[280px]">{children}</div>
    </section>
  )
}

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()

  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard-data'],
    queryFn: async (): Promise<AdminDashboardResponse> => {
      const res = await fetch('/api/admin/dashboard', { method: 'GET' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load admin data')
      return data
    },
    staleTime: 20 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!dashboardQuery.error) return
    toast.error((dashboardQuery.error as Error).message)
  }, [dashboardQuery.error])

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, supabase])

  const metrics = dashboardQuery.data?.metrics
  const analytics = dashboardQuery.data?.analytics
  const activity = dashboardQuery.data?.activity ?? []

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <AdminSidebar currentPage="overview" />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl border border-white/10 bg-[#10131c] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white lg:text-3xl">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-white/60">Realtime operational analytics from backend data.</p>
              </div>
              {dashboardQuery.isFetching && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65">
                  <Loader2 size={12} className="animate-spin" />
                  Syncing
                </div>
              )}
            </div>
          </header>

          {dashboardQuery.isLoading || !metrics || !analytics ? (
            <section className="rounded-2xl border border-white/10 bg-[#10131c] p-8 text-white/60">
              Loading admin data...
            </section>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <MetricCard title="Total Users" value={metrics.totalUsers} subtitle="Registered accounts" icon={<Users size={18} />} />
                <MetricCard title="Active Today" value={metrics.activeToday} subtitle="Users active on current date" icon={<UserCheck size={18} />} />
                <MetricCard title="Total Tasks" value={metrics.totalTasks} subtitle="All task records" icon={<ListTodo size={18} />} />
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="7-Day Signups Trend" subtitle="New users per day">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.signups7d}>
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0e1119', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                      <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} dot={{ r: 3, fill: '#22c55e' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Tasks Created vs Completed" subtitle="Last 7 days performance">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.tasksTrend7d}>
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0e1119', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                      <Bar dataKey="created" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="Task Status Distribution" subtitle="Current workload split">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.statusDistribution}
                        dataKey="value"
                        innerRadius={70}
                        outerRadius={102}
                        paddingAngle={3}
                        cx="50%"
                        cy="50%"
                      >
                        {analytics.statusDistribution.map((entry, idx) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Completion Momentum" subtitle="Created vs completed trend lines">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.tasksTrend7d}>
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0e1119', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                      <Line type="monotone" dataKey="created" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="completed" stroke="#34d399" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#10131c] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60">
                    <Sparkles size={12} />
                    Live feed
                  </div>
                </div>

                {activity.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/60">
                    No recent activity found.
                  </div>
                ) : (
                  <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
                    {activity.map((item) => {
                      const meta = activityMeta(item.type)
                      return (
                        <article
                          key={item.id}
                          className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0e1119] p-4"
                        >
                          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400/80 via-emerald-400/70 to-violet-400/70" />
                          <div className="ml-2 flex items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${meta.classes}`}>
                                {meta.icon}
                                {meta.badge}
                              </div>
                              <p className="text-sm text-white">{item.message}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs text-white/50">{timeAgo(item.createdAt)}</p>
                              <p className="mt-1 text-[11px] text-white/35">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
