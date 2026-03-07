# API.md — LifeFlow API Reference

> Documentation for all Next.js API routes, React Query hooks, and Supabase direct calls used in LifeFlow.

---

## Overview

LifeFlow uses a **hybrid data fetching strategy**:
- **Server Components** → direct Supabase server client calls (no API route needed)
- **Client Components** → React Query hooks wrapping Supabase browser client
- **Admin operations** → Next.js API routes using the service role key

---

## Authentication

### Sign Up
```typescript
// POST — handled via Supabase Auth client directly
const { error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: { username: 'cooluser' },
    emailRedirectTo: `${origin}/auth/callback`,
  },
})
```

### Sign In (Email/Password)
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword',
})
```

### Sign In (Google OAuth)
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${origin}/auth/callback` },
})
```

### Sign In (Magic Link)
```typescript
await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: { emailRedirectTo: `${origin}/auth/callback` },
})
```

### Sign Out
```typescript
await supabase.auth.signOut()
```

### Get Current User (Client)
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Get Current User (Server Component)
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')
```

---

## Profile Hooks

### `useProfile()`
```typescript
// lib/hooks/useProfile.ts
export function useProfile() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },
  })
}
```

### `useUpdateProfile()`
```typescript
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated!')
    },
  })
}
```

---

## Task Hooks

### `useTasks(filters?)`

Fetch tasks, optionally filtered by status and/or date.

```typescript
// Usage examples:
const { data: allTasks } = useTasks()
const { data: todayTasks } = useTasks({ date: '2024-03-14' })
const { data: pendingTasks } = useTasks({ status: 'pending' })

// Returns: Task[] | undefined
// Includes: subtasks, tags (via joins)
```

**Query key:** `['tasks', filters]`

**Supabase query:**
```typescript
supabase
  .from('tasks')
  .select(`
    *,
    subtasks(*),
    task_tags(
      tag_id,
      tags(id, name, color)
    )
  `)
  .eq('user_id', userId)
  .order('order_index', { ascending: true })
```

---

### `useCreateTask()`

```typescript
const createTask = useCreateTask()

// Usage:
createTask.mutate({
  title: 'Buy groceries',
  description: 'Milk, eggs, bread',
  due_date: '2024-03-15',
  due_time: '18:00',
  priority: 'medium',
  status: 'pending',
})
```

**On success:** Invalidates `['tasks']`, shows success toast, calls streak/XP update.

---

### `useUpdateTask()`

Supports optimistic updates — UI updates immediately, rolls back on error.

```typescript
const updateTask = useUpdateTask()

// Change status (Kanban drag-drop):
updateTask.mutate({ id: taskId, status: 'completed', completed_at: new Date().toISOString() })

// Update order (after drag):
updateTask.mutate({ id: taskId, order_index: newIndex })

// Edit task details:
updateTask.mutate({ id: taskId, title: 'New title', priority: 'high' })
```

---

### `useDeleteTask()`

```typescript
const deleteTask = useDeleteTask()

deleteTask.mutate(taskId)
// Confirms before calling if you wrap in a dialog
```

---

### `useTaskStats()`

Returns daily/weekly stats for the dashboard.

```typescript
export function useTaskStats() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('status, due_date, completed_at')

      const todayTasks = data?.filter(t => t.due_date === today) ?? []
      const completedToday = todayTasks.filter(t => t.status === 'completed').length
      const inProgress = todayTasks.filter(t => t.status === 'in_progress').length
      const pending = todayTasks.filter(t => t.status === 'pending').length

      return {
        total: todayTasks.length,
        completed: completedToday,
        inProgress,
        pending,
        completionRate: todayTasks.length > 0
          ? Math.round((completedToday / todayTasks.length) * 100)
          : 0,
      }
    },
  })
}
```

---

## Subtask Hooks

### `useCreateSubtask()`
```typescript
export function useCreateSubtask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ taskId, title }: { taskId: string; title: string }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({ task_id: taskId, title })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
```

### `useToggleSubtask()`
```typescript
export function useToggleSubtask() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from('subtasks')
        .update({ is_completed })
        .eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
```

---

## Tags Hooks

### `useTags()`
```typescript
export function useTags() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
  })
}
```

### `useCreateTag()`
```typescript
export function useCreateTag() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('tags')
        .insert({ name, color, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  })
}
```

---

## Notifications Hooks

### `useNotifications()`
```typescript
export function useNotifications() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
  })
}
```

### `useMarkAllRead()`
```typescript
export function useMarkAllRead() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
```

---

## Search Hook

### `useTaskSearch(query)`
```typescript
export function useTaskSearch(query: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['tasks', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date')
        .textSearch('title', query, { type: 'plain', config: 'english' })
        .limit(10)

      if (error) throw error
      return data
    },
    enabled: query.length >= 2,
  })
}
```

---

## Admin API Routes

These routes use the service role key and should only be called from the admin dashboard (role-protected by middleware).

### `GET /api/admin/stats`

Returns overview stats for the admin dashboard.

```typescript
// app/api/admin/stats/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalUsers },
    { count: activeToday },
    { count: tasksCreatedToday },
    { count: tasksCompletedToday },
  ] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_date', today),
    adminClient.from('tasks').select('*', { count: 'exact', head: true }).gte('created_at', today),
    adminClient.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', today),
  ])

  return NextResponse.json({
    totalUsers,
    activeToday,
    tasksCreatedToday,
    tasksCompletedToday,
  })
}
```

---

### `GET /api/admin/users`

Returns paginated user list.

```typescript
// Query params: page (default 1), limit (default 20), search, status (active|inactive)
export async function GET(request: Request) {
  // ... auth check ...

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const search = searchParams.get('search') ?? ''
  const offset = (page - 1) * limit

  let query = adminClient
    .from('profiles')
    .select('id, username, full_name, avatar_color, role, xp, streak, created_at', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('username', `%${search}%`)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data, total: count, page, limit })
}
```

---

### `POST /api/admin/users/[id]/deactivate`

Deactivates (bans) a user account.

```typescript
export async function POST(request: Request, { params }: { params: { id: string } }) {
  // ... admin auth check ...

  const { error } = await adminClient.auth.admin.updateUserById(params.id, {
    ban_duration: '876600h', // ~100 years = effectively permanent
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

---

## Supabase RPC Calls

These call PostgreSQL functions directly.

### Update streak after task completion
```typescript
await supabase.rpc('update_user_streak', { p_user_id: userId })
```

### Award XP
```typescript
await supabase.rpc('award_xp', { p_user_id: userId, p_xp: 25 })
```

---

## Realtime Subscriptions

### Subscribe to task changes
```typescript
const channel = supabase
  .channel('tasks-realtime')
  .on('postgres_changes', {
    event: '*',              // INSERT | UPDATE | DELETE | *
    schema: 'public',
    table: 'tasks',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    console.log('Task changed:', payload)
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  })
  .subscribe()

// Cleanup:
return () => supabase.removeChannel(channel)
```

### Subscribe to notifications
```typescript
const channel = supabase
  .channel('notifications-realtime')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    toast(payload.new.message)
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })
  .subscribe()
```

---

## Error Handling Patterns

### Standard error handling in hooks
```typescript
onError: (error: Error) => {
  toast.error(error.message || 'Something went wrong')
  console.error('[LifeFlow Error]:', error)
},
```

### Supabase error codes to watch for

| Code | Meaning | How to Handle |
|------|---------|---------------|
| `PGRST116` | No rows returned | Return null/empty instead of throwing |
| `23505` | Unique constraint violation | Show "already exists" message |
| `42501` | RLS policy violation | Session expired, redirect to login |
| `PGRST301` | JWT expired | Supabase client auto-refreshes, but trigger re-login |

---

## TypeScript Types

After running `supabase gen types typescript`, your types will be in `lib/supabase/types.ts`. Use them like:

```typescript
import type { Database } from '@/lib/supabase/types'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']
type Profile = Database['public']['Tables']['profiles']['Row']
```
