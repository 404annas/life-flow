# SETUP.md — Complete Setup Guide

> Follow this guide **in order**. Every step matters. Estimated time: 45–90 minutes for a clean setup.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Supabase Project Setup](#3-supabase-project-setup)
4. [Environment Variables](#4-environment-variables)
5. [Database Setup](#5-database-setup)
6. [Row Level Security (RLS)](#6-row-level-security-rls)
7. [Supabase Auth Configuration](#7-supabase-auth-configuration)
8. [Supabase Client Setup (Next.js)](#8-supabase-client-setup-nextjs)
9. [Auth Middleware](#9-auth-middleware)
10. [Integrating v0 Components](#10-integrating-v0-components)
11. [Wiring Auth Forms](#11-wiring-auth-forms)
12. [Task CRUD with React Query](#12-task-crud-with-react-query)
13. [Kanban Drag & Drop (@dnd-kit)](#13-kanban-drag--drop-dnd-kit)
14. [Streak & XP Logic](#14-streak--xp-logic)
15. [Realtime Updates](#15-realtime-updates)
16. [Admin Dashboard](#16-admin-dashboard)
17. [PWA Setup](#17-pwa-setup)
18. [Deployment (Vercel)](#18-deployment-vercel)
19. [Common Errors & Fixes](#19-common-errors--fixes)

---

## 1. Prerequisites

Make sure you have the following installed before you begin:

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18.17+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | Any | `git --version` |

You also need accounts on:
- [Supabase](https://supabase.com) — free tier is enough
- [Vercel](https://vercel.com) — for deployment (optional but recommended)
- [Google Cloud Console](https://console.cloud.google.com) — only if you want Google OAuth

---

## 2. Clone & Install

```bash
# If starting fresh (no v0 code yet)
npx create-next-app@latest lifeflow --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd lifeflow

# Install all required dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install framer-motion
npm install recharts
npm install sonner
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install lucide-react
npm install date-fns
npm install clsx tailwind-merge
npm install class-variance-authority

# Initialize shadcn/ui
npx shadcn@latest init
# When prompted: Dark mode ✅, CSS variables ✅, default style

# Add shadcn components you'll need
npx shadcn@latest add button input label card dialog sheet badge
npx shadcn@latest add dropdown-menu avatar progress tabs separator
npx shadcn@latest add toast popover calendar command

# PWA support
npm install next-pwa
npm install --save-dev @types/next-pwa
```

---

## 3. Supabase Project Setup

### 3.1 Create a new project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization
4. Fill in:
   - **Name:** lifeflow
   - **Database Password:** generate a strong one and **save it somewhere safe**
   - **Region:** pick closest to your users
5. Click **Create new project** and wait ~2 minutes

### 3.2 Get your credentials
1. In your project, go to **Settings → API**
2. Copy these values (you'll need them for `.env.local`):
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

---

## 4. Environment Variables

Create `.env.local` in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Only needed if using Supabase server-side with service role (admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LifeFlow
```

Create `.env.example` (this one goes to git, without real values):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LifeFlow
```

Add `.env.local` to `.gitignore` (should already be there with Next.js):
```
.env.local
```

---

## 5. Database Setup

Go to your Supabase project → **SQL Editor** → **New query** and run the following SQL blocks **one at a time**.

### 5.1 Enable Extensions

```sql
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- for full-text search
```

### 5.2 Create Profiles Table

```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_color text default '#8b5cf6',
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  xp integer default 0,
  level integer default 1,
  streak integer default 0,
  best_streak integer default 0,
  daily_goal integer default 5,
  accent_color text default 'purple',
  onboarding_completed boolean default false,
  last_active_date date,
  push_notifications_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

If your table already exists, run:
```sql
alter table public.profiles
add column if not exists onboarding_completed boolean default false;
```

### 5.3 Create Tags Table

```sql
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text not null default '#8b5cf6',
  created_at timestamptz default now()
);
```

### 5.4 Create Tasks Table

```sql
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date,
  due_time time,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'archived')),
  order_index integer default 0,
  recurrence jsonb, -- { type: 'daily' | 'weekly' | 'custom', days: [1,3,5] }
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.5 Create Task Tags Junction Table

```sql
create table public.task_tags (
  task_id uuid references public.tasks(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (task_id, tag_id)
);
```

### 5.6 Create Subtasks Table

```sql
create table public.subtasks (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  order_index integer default 0,
  created_at timestamptz default now()
);
```

### 5.7 Create Notifications Table

```sql
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'warning', 'success', 'error')),
  is_read boolean default false,
  related_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz default now()
);
```

### 5.8 Create Achievements Table

```sql
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null, -- e.g. 'first_task', 'streak_7', 'tasks_100'
  name text not null,
  description text,
  icon text, -- emoji or icon name
  xp_reward integer default 0
);

create table public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_id uuid references public.achievements(id) on delete cascade,
  unlocked_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

-- Seed default achievements
insert into public.achievements (key, name, description, icon, xp_reward) values
  ('first_task', 'First Step', 'Complete your first task', '✅', 50),
  ('streak_3', '3 Day Streak', 'Maintain a 3-day streak', '🔥', 100),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', '⚡', 250),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', '🏆', 1000),
  ('tasks_10', 'Getting Started', 'Complete 10 tasks total', '🌱', 100),
  ('tasks_50', 'Productive', 'Complete 50 tasks total', '💪', 300),
  ('tasks_100', 'Century Club', 'Complete 100 tasks total', '💯', 500),
  ('night_owl', 'Night Owl', 'Complete a task after midnight', '🦉', 75),
  ('early_bird', 'Early Bird', 'Complete a task before 7am', '🌅', 75);
```

### 5.9 Auto-create Profile on Signup

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 5.10 Auto-update updated_at timestamps

```sql
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_tasks_updated
  before update on public.tasks
  for each row execute function public.handle_updated_at();
```

### 5.11 Streak Update Function

```sql
create or replace function public.update_user_streak(p_user_id uuid)
returns void as $$
declare
  v_last_active date;
  v_current_streak integer;
  v_best_streak integer;
  v_today date := current_date;
begin
  select last_active_date, streak, best_streak
  into v_last_active, v_current_streak, v_best_streak
  from public.profiles
  where id = p_user_id;

  if v_last_active = v_today then
    -- Already updated today, do nothing
    return;
  elsif v_last_active = v_today - interval '1 day' then
    -- Consecutive day, increment streak
    v_current_streak := v_current_streak + 1;
  else
    -- Streak broken, reset to 1
    v_current_streak := 1;
  end if;

  v_best_streak := greatest(v_best_streak, v_current_streak);

  update public.profiles
  set
    streak = v_current_streak,
    best_streak = v_best_streak,
    last_active_date = v_today
  where id = p_user_id;
end;
$$ language plpgsql security definer;
```

### 5.12 XP Award Function

```sql
create or replace function public.award_xp(p_user_id uuid, p_xp integer)
returns void as $$
declare
  v_new_xp integer;
  v_new_level integer;
begin
  update public.profiles
  set xp = xp + p_xp
  where id = p_user_id
  returning xp into v_new_xp;

  -- Level up formula: level = floor(xp / 500) + 1
  v_new_level := floor(v_new_xp / 500) + 1;

  update public.profiles
  set level = v_new_level
  where id = p_user_id;
end;
$$ language plpgsql security definer;
```

---

## 6. Row Level Security (RLS)

Run this in SQL Editor:

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;
alter table public.notifications enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- =====================
-- PROFILES POLICIES
-- =====================

-- Users can view their own profile
create policy "users_select_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can view all profiles
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create policy "admins_select_all_profiles"
  on public.profiles for select
  using (public.is_current_user_admin());

-- Users can update their own profile
create policy "users_update_own_profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =====================
-- TASKS POLICIES
-- =====================

-- Users can do everything with their own tasks
create policy "users_all_own_tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- SUBTASKS POLICIES
-- =====================

create policy "users_all_own_subtasks"
  on public.subtasks for all
  using (
    exists (
      select 1 from public.tasks
      where id = subtasks.task_id and user_id = auth.uid()
    )
  );

-- =====================
-- TAGS POLICIES
-- =====================

create policy "users_all_own_tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- TASK_TAGS POLICIES
-- =====================

create policy "users_all_own_task_tags"
  on public.task_tags for all
  using (
    exists (
      select 1 from public.tasks
      where id = task_tags.task_id and user_id = auth.uid()
    )
  );

-- =====================
-- NOTIFICATIONS POLICIES
-- =====================

create policy "users_all_own_notifications"
  on public.notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- ACHIEVEMENTS POLICIES
-- =====================

-- Everyone can read achievements (they're global)
create policy "anyone_select_achievements"
  on public.achievements for select
  using (true);

create policy "users_select_own_user_achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "users_insert_own_user_achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);
```

---

## 7. Supabase Auth Configuration

### 7.1 Email Auth
1. Go to **Authentication → Providers → Email**
2. Make sure **Enable Email Provider** is ON
3. For development: turn OFF **Confirm email** (makes testing easier)
4. For production: turn it back ON

### 7.2 Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services → OAuth consent screen** → configure it
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
7. Copy the **Client ID** and **Client Secret**
8. Back in Supabase: **Authentication → Providers → Google**
9. Enable it, paste your Client ID and Secret, save

### 7.3 Magic Link
No extra config needed — it works out of the box with email auth enabled.

### 7.4 Redirect URLs
In Supabase → **Authentication → URL Configuration**:
- **Site URL:** `http://localhost:3000` (change to your production URL later)
- **Redirect URLs:** Add:
  ```
  http://localhost:3000/auth/callback
  https://your-production-domain.com/auth/callback
  ```

### 7.5 Create Auth Callback Route

Create `app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
```

---

## 8. Supabase Client Setup (Next.js)

### 8.1 Browser Client

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 8.2 Server Client

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — cookies can be read but not set
          }
        },
      },
    }
  )
}
```

### 8.3 Admin Client (Service Role — only for admin API routes)

Create `lib/supabase/admin.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// WARNING: Only use this in server-side API routes, never in client components
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

### 8.4 Generate TypeScript Types from Supabase

Install the Supabase CLI:
```bash
npm install -g supabase
supabase login
```

Generate types:
```bash
supabase gen types typescript --project-id your-project-ref > lib/supabase/types.ts
```

Run this command again whenever you change your database schema.

---

## 9. Auth Middleware

Create `middleware.ts` at the project root:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')

  // Not logged in → redirect to login (except on auth pages)
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Logged in → redirect away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Admin page protection: check role
  if (user && isAdminPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 10. Integrating v0 Components

### 10.1 Copy v0 components
Place all your v0-generated components in the correct directories:

```
components/
├── auth/
│   ├── LoginForm.tsx      ← from v0 prompt 1
│   ├── SignupForm.tsx      ← from v0 prompt 1
│   └── OnboardingFlow.tsx ← from v0 prompt 1
├── dashboard/
│   ├── StatsRow.tsx       ← from v0 prompt 2
│   ├── CompletionRings.tsx
│   ├── TodayTasks.tsx
│   └── QuickAddFAB.tsx
├── board/
│   ├── KanbanBoard.tsx    ← from v0 prompt 3
│   ├── KanbanColumn.tsx
│   └── TaskCard.tsx
├── calendar/
│   └── CalendarView.tsx   ← from v0 prompt 4
├── profile/
│   └── ProfilePage.tsx    ← from v0 prompt 5
└── admin/
    └── AdminDashboard.tsx ← from v0 prompt 6
```

### 10.2 Fix common v0 issues
v0 often generates components with:
- `"use client"` missing → add it at the top of interactive components
- Hardcoded mock data → replace with real props/hooks
- Missing imports → install and import missing packages
- `any` types → replace with proper TypeScript types from your Supabase types

---

## 11. Wiring Auth Forms

Create `lib/hooks/useAuth.ts`:

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function useAuth() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    else router.push('/onboarding')
    setLoading(false)
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithMagicLink = async (email: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    else setError('Check your email for the magic link!')
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return { signUp, signIn, signInWithGoogle, signInWithMagicLink, signOut, loading, error }
}
```

---

## 12. Task CRUD with React Query

### 12.1 Setup React Query Provider

Create `components/providers/QueryProvider.tsx`:

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Add it to `app/layout.tsx`:
```typescript
import { QueryProvider } from '@/components/providers/QueryProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
```

### 12.2 Task Hooks

Create `lib/hooks/useTasks.ts`:

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const supabase = createClient()

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  due_time: string | null
  priority: TaskPriority
  status: TaskStatus
  order_index: number
  created_at: string
  completed_at: string | null
}

// Fetch all tasks for the current user
export function useTasks(filters?: { status?: TaskStatus; date?: string }) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*, subtasks(*), task_tags(tag_id, tags(*))')
        .order('order_index', { ascending: true })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.date) query = query.eq('due_date', filters.date)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

// Create a task
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created!')
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`)
    },
  })
}

// Update a task
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async (updatedTask) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData(['tasks'])
      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old?.map(task => task.id === updatedTask.id ? { ...task, ...updatedTask } : task)
      )
      return { previousTasks }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks)
      toast.error('Failed to update task')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })
}
```

---

## 13. Kanban Drag & Drop (@dnd-kit)

Create `components/board/KanbanBoard.tsx`:

```typescript
'use client'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useState } from 'react'
import { useTasks, useUpdateTask, Task, TaskStatus } from '@/lib/hooks/useTasks'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'

const COLUMNS: { id: TaskStatus; label: string; emoji: string; color: string }[] = [
  { id: 'pending', label: 'Pending', emoji: '⏳', color: 'border-gray-500' },
  { id: 'in_progress', label: 'In Progress', emoji: '🔄', color: 'border-violet-500' },
  { id: 'completed', label: 'Completed', emoji: '✅', color: 'border-green-500' },
]

export function KanbanBoard() {
  const { data: tasks = [] } = useTasks()
  const updateTask = useUpdateTask()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    updateTask.mutate({
      id: taskId,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter(t => t.status === column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
```

---

## 14. Streak & XP Logic

Call these from your task completion handler:

```typescript
// In your task update mutation, after a task is marked completed:
const handleTaskComplete = async (taskId: string) => {
  await updateTask.mutateAsync({ id: taskId, status: 'completed', completed_at: new Date().toISOString() })

  // Award XP
  await supabase.rpc('award_xp', { p_user_id: userId, p_xp: 25 })

  // Update streak
  await supabase.rpc('update_user_streak', { p_user_id: userId })

  // Refresh profile
  queryClient.invalidateQueries({ queryKey: ['profile'] })
}
```

---

## 15. Realtime Updates

Create `lib/hooks/useRealtime.ts`:

```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeTasks(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, queryClient])
}
```

---

## 16. Admin Dashboard

Create `app/admin/overview/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Total users
  const { count: totalUsers } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Tasks created today
  const today = new Date().toISOString().split('T')[0]
  const { count: tasksToday } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)

  // Tasks completed today
  const { count: completedToday } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', today)

  return (
    <div>
      {/* Pass these stats into your v0 admin dashboard component */}
      <pre>{JSON.stringify({ totalUsers, tasksToday, completedToday }, null, 2)}</pre>
    </div>
  )
}
```

---

## 17. PWA Setup

### 17.1 Configure next-pwa

Update `next.config.ts`:

```typescript
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

export default config({
  // your existing next config
})
```

### 17.2 Create manifest.json

Create `public/manifest.json`:

```json
{
  "name": "LifeFlow — Task Manager",
  "short_name": "LifeFlow",
  "description": "A modern Gen-Z task management app",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#8b5cf6",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add to `app/layout.tsx` head:
```typescript
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#8b5cf6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LifeFlow',
  },
}
```

---

## 18. Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# Project Settings → Environment Variables → add all from .env.local
```

Or connect your GitHub repo to Vercel for automatic deploys on push.

**After deploying:**
1. Update Supabase → Authentication → URL Configuration with your production URL
2. Add production callback URL to Google OAuth allowed redirects
3. Update `NEXT_PUBLIC_APP_URL` env var in Vercel to your production URL

---

## 19. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Row Level Security violation` | RLS policy not set correctly | Re-check section 6, make sure all policies are created |
| `No user found` | Session not passed to server | Use `createClient()` from `lib/supabase/server.ts` in server components |
| `Hydration mismatch` | Client/server HTML differs | Add `suppressHydrationWarning` to `<html>` tag |
| `Cannot read property of undefined` | Supabase data is null | Add null checks or optional chaining (`data?.field`) |
| `Middleware redirect loop` | Auth check failing in middleware | Make sure auth pages are excluded from middleware matcher |
| `NEXT_PUBLIC vars undefined` | Missing env vars | Check `.env.local` exists and restart dev server |
| `Types error from Supabase` | Types not generated | Run `supabase gen types typescript ...` again |
| `Drag not working on mobile` | Missing TouchSensor | Add `TouchSensor` to dnd-kit sensors (see step 13) |

---

## ✅ Setup Complete Checklist

- [ ] Next.js project created and dependencies installed
- [ ] Supabase project created
- [ ] `.env.local` filled with credentials
- [ ] All SQL tables created
- [ ] RLS policies applied
- [ ] Auth providers configured (Email, Google, Magic Link)
- [ ] Callback route created
- [ ] Supabase clients (browser + server) set up
- [ ] Middleware protecting routes
- [ ] TypeScript types generated from Supabase
- [ ] v0 components integrated
- [ ] Auth forms wired to Supabase
- [ ] React Query set up with task hooks
- [ ] Kanban drag-and-drop working
- [ ] Streak + XP functions called on task complete
- [ ] Realtime subscription active
- [ ] Admin dashboard showing live data
- [ ] PWA manifest added
- [ ] Deployed to Vercel

---

> 💡 **Next step:** Run `npm run dev` and open `http://localhost:3000`. You should be redirected to `/auth/login`. Start by wiring up the login form and testing the full auth flow.
