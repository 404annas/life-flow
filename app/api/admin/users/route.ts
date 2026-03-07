import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function toIsoDateOnly(date: Date) {
  return date.toISOString().split('T')[0]
}

function diffDays(fromIso: string | null) {
  if (!fromIso) return 9999
  const from = new Date(fromIso)
  const today = new Date()
  const startFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.floor((startToday.getTime() - startFrom.getTime()) / (1000 * 60 * 60 * 24))
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

    const { data: me, error: meError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (meError || me?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [{ data: profileRows, error: profileError }, { data: taskRows, error: taskError }, authUsersRes] =
      await Promise.all([
        adminClient
          .from('profiles')
          .select(
            'id, username, full_name, role, created_at, streak, level, xp, last_active_date, avatar_color'
          )
          .order('created_at', { ascending: false }),
        adminClient.from('tasks').select('user_id, status'),
        adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ])

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 })
    }
    if (authUsersRes.error) {
      return NextResponse.json({ error: authUsersRes.error.message }, { status: 500 })
    }

    const users = authUsersRes.data?.users ?? []
    const emailMap = new Map(users.map((u) => [u.id, u.email ?? '']))

    const taskAgg = new Map<string, { total: number; completed: number }>()
    for (const row of taskRows ?? []) {
      const key = row.user_id
      if (!taskAgg.has(key)) {
        taskAgg.set(key, { total: 0, completed: 0 })
      }
      const agg = taskAgg.get(key)!
      agg.total += 1
      if (row.status === 'completed') agg.completed += 1
    }

    const todayIso = toIsoDateOnly(new Date())
    const payload = (profileRows ?? []).map((p) => {
      const agg = taskAgg.get(p.id) ?? { total: 0, completed: 0 }
      const days = diffDays(p.last_active_date)
      const isToday = p.last_active_date === todayIso
      const derivedStatus = isToday || days <= 7 ? 'active' : 'inactive'

      return {
        id: p.id,
        username: p.username ?? 'unknown',
        fullName: p.full_name ?? '',
        email: emailMap.get(p.id) ?? '',
        role: p.role ?? 'user',
        createdAt: p.created_at,
        streak: p.streak ?? 0,
        level: p.level ?? 1,
        xp: p.xp ?? 0,
        lastActiveDate: p.last_active_date,
        status: derivedStatus,
        avatarColor: p.avatar_color ?? '#3b82f6',
        tasksTotal: agg.total,
        tasksCompleted: agg.completed,
      }
    })

    return NextResponse.json({ users: payload })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
