# DATABASE.md — LifeFlow Database Reference

> Complete reference for the LifeFlow Supabase PostgreSQL schema, including all tables, relationships, RLS policies, functions, and triggers.

---

## Table of Contents

1. [Entity Relationship Diagram](#entity-relationship-diagram)
2. [Tables Reference](#tables-reference)
3. [Relationships](#relationships)
4. [RLS Policies](#rls-policies)
5. [Functions & Triggers](#functions--triggers)
6. [Indexes](#indexes)
7. [Full Setup SQL](#full-setup-sql)
8. [Seeding Test Data](#seeding-test-data)

---

## Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    │ 1:1
    ▼
profiles ──────────────────────────────────────────────────────┐
    │                                                           │
    │ 1:many                    1:many                          │
    ▼                           ▼                              │
tasks ◄──────────── task_tags ──────► tags                     │
    │                                                           │
    │ 1:many          1:many                                    │
    ▼                  ▼                                        │
subtasks        task_activity                                   │
                                                                │
notifications ◄─────────────────────────────────────────────── ┘
user_achievements ◄─────────────────────────────────────────── ┘
achievements (global)
```

---

## Tables Reference

### `profiles`

Extends Supabase's `auth.users`. Created automatically on signup via trigger.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `uuid` | — | Primary key, references `auth.users.id` |
| `username` | `text` | — | Unique username |
| `full_name` | `text` | `''` | Display name |
| `avatar_color` | `text` | `'#8b5cf6'` | Hex color for avatar background |
| `avatar_url` | `text` | `null` | URL to profile picture (Supabase Storage) |
| `role` | `text` | `'user'` | `'user'` or `'admin'` |
| `xp` | `integer` | `0` | Total XP points earned |
| `level` | `integer` | `1` | Calculated from XP |
| `streak` | `integer` | `0` | Current consecutive day streak |
| `best_streak` | `integer` | `0` | All-time highest streak |
| `daily_goal` | `integer` | `5` | Daily tasks target |
| `accent_color` | `text` | `'purple'` | UI accent color preference |
| `onboarding_completed` | `boolean` | `false` | Whether onboarding has been finished |
| `last_active_date` | `date` | `null` | Last date user completed a task |
| `push_notifications_enabled` | `boolean` | `true` | Push notification preference |
| `created_at` | `timestamptz` | `now()` | Account creation timestamp |
| `updated_at` | `timestamptz` | `now()` | Last profile update |

---

### `tasks`

Core table. Each row represents a single task belonging to a user.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `uuid` | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | — | References `profiles.id` |
| `title` | `text` | — | Task title (required) |
| `description` | `text` | `null` | Longer description, supports markdown |
| `due_date` | `date` | `null` | Date the task is due |
| `due_time` | `time` | `null` | Time the task is due |
| `priority` | `text` | `'medium'` | `low`, `medium`, `high`, `urgent` |
| `status` | `text` | `'pending'` | `pending`, `in_progress`, `completed`, `archived` |
| `order_index` | `integer` | `0` | Position within its status column (Kanban order) |
| `recurrence` | `jsonb` | `null` | Recurrence rule: `{ type: 'daily' \| 'weekly', days: [0-6] }` |
| `completed_at` | `timestamptz` | `null` | When the task was marked complete |
| `created_at` | `timestamptz` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `now()` | Last modification timestamp |

**Priority Enum Values:**
- `low` — Green, low urgency
- `medium` — Yellow, normal tasks
- `high` — Orange, important tasks
- `urgent` — Red, drop everything

**Status Enum Values:**
- `pending` — Not started yet
- `in_progress` — Currently being worked on
- `completed` — Done ✅
- `archived` — Soft-deleted / hidden

---

### `subtasks`

Checklist items within a task.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `uuid` | `uuid_generate_v4()` | Primary key |
| `task_id` | `uuid` | — | References `tasks.id` |
| `title` | `text` | — | Subtask label |
| `is_completed` | `boolean` | `false` | Completion state |
| `order_index` | `integer` | `0` | Display order |
| `created_at` | `timestamptz` | `now()` | Creation timestamp |

---

### `tags`

User-defined labels they can apply to tasks.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `uuid` | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | — | References `profiles.id` |
| `name` | `text` | — | Tag label (e.g., "Work", "Personal") |
| `color` | `text` | `'#8b5cf6'` | Hex color for the tag pill |
| `created_at` | `timestamptz` | `now()` | Creation timestamp |

---

### `task_tags`

Many-to-many junction between tasks and tags.

| Column | Type | Description |
|--------|------|-------------|
| `task_id` | `uuid` | References `tasks.id` |
| `tag_id` | `uuid` | References `tags.id` |

Composite primary key: `(task_id, tag_id)`

---

### `notifications`

In-app notification messages for users.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `uuid` | `uuid_generate_v4()` | Primary key |
| `user_id` | `uuid` | — | References `profiles.id` |
| `title` | `text` | — | Notification headline |
| `message` | `text` | — | Notification body |
| `type` | `text` | `'info'` | `info`, `warning`, `success`, `error` |
| `is_read` | `boolean` | `false` | Whether user has seen it |
| `related_task_id` | `uuid` | `null` | Optional link to a task |
| `created_at` | `timestamptz` | `now()` | Creation timestamp |

---

### `achievements`

Global list of all possible achievements (not per-user).

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `uuid` | `uuid_generate_v4()` | Primary key |
| `key` | `text` | — | Unique identifier (e.g., `'streak_7'`) |
| `name` | `text` | — | Display name |
| `description` | `text` | `null` | What the user did to earn it |
| `icon` | `text` | `null` | Emoji or icon name |
| `xp_reward` | `integer` | `0` | XP granted when unlocked |

---

### `user_achievements`

Tracks which achievements each user has unlocked.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | `uuid` | References `profiles.id` |
| `achievement_id` | `uuid` | References `achievements.id` |
| `unlocked_at` | `timestamptz` | When it was earned |

Composite primary key: `(user_id, achievement_id)`

---

## Relationships

```
profiles.id → tasks.user_id          (one-to-many)
profiles.id → tags.user_id           (one-to-many)
profiles.id → notifications.user_id  (one-to-many)
profiles.id → user_achievements.user_id (one-to-many)

tasks.id → subtasks.task_id          (one-to-many)
tasks.id → task_tags.task_id         (many-to-many via task_tags)
tasks.id → notifications.related_task_id (optional reference)

tags.id → task_tags.tag_id           (many-to-many via task_tags)

achievements.id → user_achievements.achievement_id (one-to-many)
```

---

## RLS Policies

### Summary

| Table | Policy | Who | Condition |
|-------|--------|-----|-----------|
| profiles | SELECT | Self | `auth.uid() = id` |
| profiles | SELECT | Admin | User has `role = 'admin'` |
| profiles | UPDATE | Self | `auth.uid() = id` |
| tasks | ALL | Self | `auth.uid() = user_id` |
| subtasks | ALL | Self | Owns parent task |
| tags | ALL | Self | `auth.uid() = user_id` |
| task_tags | ALL | Self | Owns parent task |
| notifications | ALL | Self | `auth.uid() = user_id` |
| achievements | SELECT | Anyone | `true` |
| user_achievements | SELECT | Self | `auth.uid() = user_id` |
| user_achievements | INSERT | Self | `auth.uid() = user_id` |

### Important Notes

- RLS is **enabled on all tables** — if you create a new table, remember to `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Without a matching policy, **all access is denied** by default
- Admin operations (deactivating users, viewing all profiles) use the **service role key** server-side — this bypasses RLS intentionally
- Never expose the service role key to the client/browser

---

## Functions & Triggers

### `handle_new_user()`

Trigger: fires `AFTER INSERT ON auth.users`

Creates a profile record automatically when a new user signs up via Supabase Auth.

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
```

---

### `handle_updated_at()`

Trigger: fires `BEFORE UPDATE ON profiles, tasks`

Automatically sets `updated_at` to the current timestamp on every update.

```sql
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

---

### `update_user_streak(p_user_id uuid)`

Called manually after a user completes a task. Handles streak logic:
- Same day → no change
- Previous day → increment streak
- Any other gap → reset to 1

Updates `streak`, `best_streak`, and `last_active_date`.

---

### `award_xp(p_user_id uuid, p_xp integer)`

Called manually to grant XP. Also recalculates `level` using:
```
level = floor(xp / 500) + 1
```

---

## Indexes

Create these to speed up common queries:

```sql
-- Tasks by user and status (Kanban board query)
create index idx_tasks_user_status on public.tasks(user_id, status);

-- Tasks by user and due date (Calendar view query)
create index idx_tasks_user_due_date on public.tasks(user_id, due_date);

-- Notifications by user and read status
create index idx_notifications_user_unread on public.notifications(user_id, is_read)
  where is_read = false;

-- Subtasks by task
create index idx_subtasks_task_id on public.subtasks(task_id);

-- Tags by user
create index idx_tags_user_id on public.tags(user_id);

-- Full-text search on task title
create index idx_tasks_title_fts on public.tasks
  using gin(to_tsvector('english', title));
```

---

## Full Setup SQL

Run all of these in order in your Supabase SQL Editor:

### Step 1: Extensions
```sql
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
```

### Step 2: Tables
```sql
-- (paste all CREATE TABLE statements from SETUP.md section 5)
```

### Step 3: Triggers & Functions
```sql
-- (paste all function + trigger definitions)
```

### Step 4: RLS
```sql
-- (paste all ALTER TABLE + CREATE POLICY statements)
```

### Step 5: Indexes
```sql
-- (paste all CREATE INDEX statements from above)
```

### Step 6: Seed Achievements
```sql
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

---

## Seeding Test Data

Run this to create test data during development (replace `YOUR_USER_ID` with your actual user UUID from Supabase Auth → Users):

```sql
-- Create test tags
insert into public.tags (user_id, name, color) values
  ('YOUR_USER_ID', 'Work', '#8b5cf6'),
  ('YOUR_USER_ID', 'Personal', '#06b6d4'),
  ('YOUR_USER_ID', 'Health', '#22c55e'),
  ('YOUR_USER_ID', 'Learning', '#f59e0b');

-- Create test tasks
insert into public.tasks (user_id, title, description, due_date, due_time, priority, status, order_index) values
  ('YOUR_USER_ID', 'Review pull request #42', 'Check the authentication changes in the PR', current_date, '10:00', 'high', 'pending', 0),
  ('YOUR_USER_ID', 'Morning workout', '30 min cardio + strength training', current_date, '07:00', 'medium', 'completed', 0),
  ('YOUR_USER_ID', 'Read chapter 5 of Clean Code', null, current_date, '20:00', 'low', 'in_progress', 0),
  ('YOUR_USER_ID', 'Plan weekly meals', 'Prep for Sunday grocery run', current_date + 1, null, 'medium', 'pending', 1),
  ('YOUR_USER_ID', 'Fix login bug', 'Users cant login with Google on mobile', current_date, '14:00', 'urgent', 'in_progress', 1);
```

---

## Common Queries

### Get today's tasks for a user
```sql
select * from tasks
where user_id = auth.uid()
and due_date = current_date
order by priority desc, due_time asc;
```

### Get task completion rate this week
```sql
select
  count(*) filter (where status = 'completed') as completed,
  count(*) as total,
  round(count(*) filter (where status = 'completed') * 100.0 / count(*), 1) as rate
from tasks
where user_id = auth.uid()
and created_at >= date_trunc('week', now());
```

### Full-text search tasks
```sql
select * from tasks
where user_id = auth.uid()
and to_tsvector('english', title || ' ' || coalesce(description, ''))
    @@ plainto_tsquery('english', 'your search term');
```

### Admin: Get DAU (daily active users)
```sql
select count(distinct user_id) as dau
from tasks
where completed_at >= current_date;
```
