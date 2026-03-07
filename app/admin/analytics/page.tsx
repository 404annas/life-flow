'use client'

import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Sparkles, UserPlus, ListTodo, Activity } from 'lucide-react'
import {
  AreaChart,
  Area,
  Bar,
  ComposedChart,
  Cell,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/lifeflow/admin-sidebar'

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
    return {
      icon: <UserPlus size={14} />,
      badge: 'New User',
      classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    }
  }
  if (type === 'task_created') {
    return {
      icon: <ListTodo size={14} />,
      badge: 'Task Created',
      classes: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
    }
  }
  return {
    icon: <CheckCircle2 size={14} />,
    badge: 'Task Completed',
    classes: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
  }
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#10131c] p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/50">{subtitle}</p>
      </div>
      <div className="h-[300px]">{children}</div>
    </section>
  )
}

export default function AdminAnalyticsPage() {
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()

  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics-data'],
    queryFn: async (): Promise<AdminDashboardResponse> => {
      const res = await fetch('/api/admin/dashboard', { method: 'GET' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load admin analytics')
      return data
    },
    staleTime: 20 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!analyticsQuery.error) return
    toast.error((analyticsQuery.error as Error).message)
  }, [analyticsQuery.error])

  useEffect(() => {
    const channel = supabase
      .channel('admin-analytics-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-analytics-data'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-analytics-data'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, supabase])

  const data = analyticsQuery.data
  const healthRadar = data
    ? [
        { metric: 'Completion', value: data.metrics.completionRate },
        {
          metric: 'Active Users',
          value:
            data.metrics.totalUsers > 0
              ? Math.round((data.metrics.activeToday / data.metrics.totalUsers) * 100)
              : 0,
        },
        {
          metric: 'Throughput',
          value:
            data.metrics.totalTasks > 0
              ? Math.round((data.metrics.completedTasks / data.metrics.totalTasks) * 100)
              : 0,
        },
        {
          metric: 'Flow',
          value:
            data.metrics.totalTasks > 0
              ? Math.round(
                  ((data.metrics.inProgressTasks + data.metrics.completedTasks) / data.metrics.totalTasks) * 100
                )
              : 0,
        },
      ]
    : []

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <AdminSidebar currentPage="analytics" />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl border border-white/10 bg-[#10131c] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white lg:text-3xl">Analytics</h1>
                <p className="mt-1 text-sm text-white/60">
                  Signal-rich charts for growth, productivity, and execution quality.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {data && (
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                    Completion Rate {data.metrics.completionRate}%
                  </span>
                )}
                {analyticsQuery.isFetching && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65">
                    <Loader2 size={12} className="animate-spin" />
                    Syncing
                  </span>
                )}
              </div>
            </div>
          </header>

          {!data ? (
            <section className="rounded-2xl border border-white/10 bg-[#10131c] p-8 text-white/60">
              Loading analytics...
            </section>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="Execution Mix" subtitle="Created workload vs completed output">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.analytics.tasksTrend7d}>
                      <defs>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="10%" stopColor="#34d399" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0e1119', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                      <Bar dataKey="created" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                      <Area type="monotone" dataKey="completed" stroke="#34d399" fill="url(#completedGrad)" strokeWidth={2.3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Operations Radar" subtitle="Composite health across key dimensions">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={healthRadar}>
                      <PolarGrid stroke="rgba(255,255,255,0.16)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#0e1119', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                      <Radar name="Health" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.24} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard title="Growth Surface" subtitle="7-day signups with soft volume fill">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.analytics.signups7d}>
                      <defs>
                        <linearGradient id="signupArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="8%" stopColor="#22c55e" stopOpacity={0.42} />
                          <stop offset="92%" stopColor="#22c55e" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#0e1119', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                      <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2.5} fill="url(#signupArea)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Status Donut" subtitle="Current workload distribution">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.analytics.statusDistribution} dataKey="value" innerRadius={78} outerRadius={108} paddingAngle={4}>
                        {data.analytics.statusDistribution.map((entry, idx) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10 }} />
                    </PieChart>
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

                {data.activity.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/60">
                    No recent activity found.
                  </div>
                ) : (
                  <div className="grid max-h-[520px] grid-cols-1 gap-3 overflow-y-auto pr-1 xl:grid-cols-2">
                    {data.activity.map((item) => {
                      const meta = activityMeta(item.type)
                      return (
                        <article key={item.id} className="group rounded-xl border border-white/10 bg-[#0d111a] p-4 transition-colors hover:border-white/20">
                          <div className="flex items-start justify-between gap-3">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${meta.classes}`}>
                              {meta.icon}
                              {meta.badge}
                            </span>
                            <span className="text-[11px] text-white/45">{timeAgo(item.createdAt)}</span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-white/90">{item.message}</p>

                          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                            <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                              <Activity size={12} />
                              Event stream
                            </span>
                            <span className="text-[11px] text-white/35">{new Date(item.createdAt).toLocaleString()}</span>
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
