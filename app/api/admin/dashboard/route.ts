import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ActivityType = 'user_joined' | 'task_created' | 'task_completed'

interface ActivityItem {
  id: string
  type: ActivityType
  message: string
  createdAt: string
}

function utcDayKey(dateLike: string | Date) {
  const d = new Date(dateLike)
  const y = d.getUTCFullYear()
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${d.getUTCDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shortDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
}

export async function GET() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: me, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || me?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const sevenDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6))
    const sevenDaysAgoIso = sevenDaysAgo.toISOString()

    const [
      profilesCountRes,
      activeTodayRes,
      tasksCountRes,
      completedCountRes,
      inProgressCountRes,
      pendingCountRes,
      profilesRecentRes,
      tasksRecentCreatedRes,
      tasksRecentCompletedRes,
      signups7dRes,
      tasksCreated7dRes,
      tasksCompleted7dRes,
    ] = await Promise.all([
      adminClient.from('profiles').select('*', { count: 'exact', head: true }),
      adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('last_active_date', today),
      adminClient.from('tasks').select('*', { count: 'exact', head: true }),
      adminClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
      adminClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress'),
      adminClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      adminClient
        .from('profiles')
        .select('id, username, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
      adminClient
        .from('tasks')
        .select('id, title, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
      adminClient
        .from('tasks')
        .select('id, title, user_id, completed_at')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(8),
      adminClient
        .from('profiles')
        .select('created_at')
        .gte('created_at', sevenDaysAgoIso),
      adminClient
        .from('tasks')
        .select('created_at')
        .gte('created_at', sevenDaysAgoIso),
      adminClient
        .from('tasks')
        .select('completed_at')
        .not('completed_at', 'is', null)
        .gte('completed_at', sevenDaysAgoIso),
    ])

    if (
      profilesCountRes.error ||
      activeTodayRes.error ||
      tasksCountRes.error ||
      completedCountRes.error ||
      inProgressCountRes.error ||
      pendingCountRes.error ||
      profilesRecentRes.error ||
      tasksRecentCreatedRes.error ||
      tasksRecentCompletedRes.error ||
      signups7dRes.error ||
      tasksCreated7dRes.error ||
      tasksCompleted7dRes.error
    ) {
      const firstError =
        profilesCountRes.error ||
        activeTodayRes.error ||
        tasksCountRes.error ||
        completedCountRes.error ||
        inProgressCountRes.error ||
        pendingCountRes.error ||
        profilesRecentRes.error ||
        tasksRecentCreatedRes.error ||
        tasksRecentCompletedRes.error ||
        signups7dRes.error ||
        tasksCreated7dRes.error ||
        tasksCompleted7dRes.error

      return NextResponse.json(
        { error: firstError?.message ?? 'Failed to load admin data' },
        { status: 500 }
      )
    }

    const recentCreatedTasks = tasksRecentCreatedRes.data ?? []
    const recentCompletedTasks = tasksRecentCompletedRes.data ?? []
    const recentUsers = profilesRecentRes.data ?? []

    const userIdSet = new Set<string>()
    for (const task of recentCreatedTasks) userIdSet.add(task.user_id)
    for (const task of recentCompletedTasks) userIdSet.add(task.user_id)

    const userIds = Array.from(userIdSet)
    let usersMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: usersData } = await adminClient
        .from('profiles')
        .select('id, username, full_name')
        .in('id', userIds)

      usersMap = new Map(
        (usersData ?? []).map((u) => [u.id, (u.full_name || u.username || 'Unknown User').trim()])
      )
    }

    const activity: ActivityItem[] = [
      ...recentUsers
        .filter((u) => Boolean(u.created_at))
        .map((u) => ({
          id: `user-${u.id}`,
          type: 'user_joined' as const,
          message: `${(u.full_name || u.username || 'New user').trim()} joined LifeFlow`,
          createdAt: u.created_at as string,
        })),
      ...recentCreatedTasks
        .filter((t) => Boolean(t.created_at))
        .map((t) => ({
          id: `task-created-${t.id}`,
          type: 'task_created' as const,
          message: `${usersMap.get(t.user_id) || 'A user'} created "${t.title}"`,
          createdAt: t.created_at as string,
        })),
      ...recentCompletedTasks
        .filter((t) => Boolean(t.completed_at))
        .map((t) => ({
          id: `task-completed-${t.id}`,
          type: 'task_completed' as const,
          message: `${usersMap.get(t.user_id) || 'A user'} completed "${t.title}"`,
          createdAt: t.completed_at as string,
        })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12)

    const totalTasks = tasksCountRes.count ?? 0
    const completedTasks = completedCountRes.count ?? 0
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const pendingTasks = pendingCountRes.count ?? 0
    const inProgressTasks = inProgressCountRes.count ?? 0

    const dayBuckets = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - idx)))
      const key = utcDayKey(date)
      return {
        key,
        label: shortDayLabel(date),
        signups: 0,
        tasksCreated: 0,
        tasksCompleted: 0,
      }
    })

    const bucketMap = new Map(dayBuckets.map((d) => [d.key, d]))

    for (const row of signups7dRes.data ?? []) {
      if (!row.created_at) continue
      const key = utcDayKey(row.created_at)
      const bucket = bucketMap.get(key)
      if (bucket) bucket.signups += 1
    }

    for (const row of tasksCreated7dRes.data ?? []) {
      if (!row.created_at) continue
      const key = utcDayKey(row.created_at)
      const bucket = bucketMap.get(key)
      if (bucket) bucket.tasksCreated += 1
    }

    for (const row of tasksCompleted7dRes.data ?? []) {
      if (!row.completed_at) continue
      const key = utcDayKey(row.completed_at)
      const bucket = bucketMap.get(key)
      if (bucket) bucket.tasksCompleted += 1
    }

    return NextResponse.json({
      metrics: {
        totalUsers: profilesCountRes.count ?? 0,
        activeToday: activeTodayRes.count ?? 0,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
      },
      analytics: {
        signups7d: dayBuckets.map((d) => ({ label: d.label, value: d.signups })),
        tasksTrend7d: dayBuckets.map((d) => ({
          label: d.label,
          created: d.tasksCreated,
          completed: d.tasksCompleted,
        })),
        statusDistribution: [
          { name: 'Pending', value: pendingTasks },
          { name: 'In Progress', value: inProgressTasks },
          { name: 'Completed', value: completedTasks },
        ],
      },
      activity,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
