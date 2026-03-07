# LifeFlow

Modern full-stack task management app built with Next.js, Supabase, and TanStack Query.

LifeFlow includes auth + onboarding, dashboard, tasks workspace, kanban board, calendar view, settings, and role-gated admin routes.

## Table of Contents
- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [App Screens / Routes](#app-screens--routes)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started (Local)](#getting-started-local)
- [Database & Supabase Setup](#database--supabase-setup)
- [Scripts](#scripts)
- [Deployment (GitHub + Vercel)](#deployment-github--vercel)
- [Known Notes](#known-notes)
- [Contributing](#contributing)

## Overview
LifeFlow is a dark-theme productivity app focused on practical task execution:
- Secure authentication with Supabase Auth
- Onboarding flow to initialize profile preferences
- Real task CRUD backed by PostgreSQL (Supabase)
- Multiple task views: Dashboard, Tasks, Kanban, Calendar
- User profile settings with stats, daily goal, password update, and account deletion
- Client-side caching and mutation flows using TanStack Query
- PWA-ready Next.js configuration

## Core Features
- `Auth`: email/password login & signup, OAuth callback support, session-aware redirects
- `Onboarding`: name, goals, accent preferences stored in `profiles`
- `Dashboard`:
  - Category-aware task list
  - Active/Completed filters
  - Create task modal with backend insert
  - Completion updates with XP/streak RPC hooks
- `Tasks Workspace`:
  - Search + status + priority + category filters
  - Detailed cards with due date, category, and status
  - Create/update/delete with confirmation
- `Kanban`:
  - Lane-based board (`pending`, `in_progress`, `completed`)
  - Delete confirmation modal
  - Database-driven lane rendering
- `Calendar`:
  - Compact monthly grid UI
  - Day-wise task list from Supabase
  - Realtime invalidation for task updates
- `Settings`:
  - Edit profile info
  - Update daily goal
  - Stats from database
  - Update password
  - Delete account via protected API route
- `Admin (role-gated routes)`:
  - Admin pages under `/admin`
  - Route-level role guard via proxy

## Tech Stack
- `Next.js 16` (App Router)
- `React 19`
- `TypeScript`
- `Tailwind CSS`
- `Supabase` (`@supabase/supabase-js`, `@supabase/ssr`)
- `TanStack Query` (cache, mutations, stale time control)
- `shadcn/ui` + Radix primitives
- `sonner` for toasts
- `next-pwa` for PWA support
- `lucide-react` icons

## App Screens / Routes
### Public/Auth
- `/auth/login`
- `/auth/signup`
- `/auth/callback`

### Protected User App
- `/onboarding`
- `/dashboard`
- `/tasks`
- `/kanban`
- `/calendar`
- `/settings`

### Admin
- `/admin`
- `/admin/overview`
- `/admin/users`
- `/admin/analytics`
- `/admin/settings`

### Redirect aliases configured
- `/kandban` -> `/kanban`
- `/kanban-board` -> `/kanban`
- `/kandban-board` -> `/kanban`

## Architecture
### Frontend
- App Router pages in `app/`
- Reusable domain components in `components/lifeflow/`
- UI primitives in `components/ui/`
- Query client provider in `components/providers/QueryProvider.tsx`

### Data Layer
- Browser/client Supabase helper: `lib/supabase/client.ts`
- Server Supabase helper: `lib/supabase/server.ts`
- Admin service-role helper: `lib/supabase/admin.ts`
- Hooks for auth/tasks/realtime in `lib/hooks/`

### Route Protection
- `proxy.ts` handles:
  - unauthenticated redirects to `/auth/login`
  - auth-page redirects for logged-in users
  - onboarding completion flow guards
  - admin route role checks (`profiles.role === 'admin'`)

## Project Structure
```text
.
|- app/
|  |- admin/
|  |- api/
|  |  |- account/delete/route.ts
|  |- auth/
|  |  |- callback/route.ts
|  |  |- login/page.tsx
|  |  |- signup/page.tsx
|  |- calendar/page.tsx
|  |- dashboard/page.tsx
|  |- kanban/page.tsx
|  |- onboarding/page.tsx
|  |- settings/page.tsx
|  |- tasks/page.tsx
|  |- layout.tsx
|  |- page.tsx
|- components/
|  |- lifeflow/
|  |- providers/QueryProvider.tsx
|  |- ui/
|- lib/
|  |- hooks/
|  |- supabase/
|  |  |- admin.ts
|  |  |- client.ts
|  |  |- server.ts
|  |  |- types.ts
|  |- utils.ts
|- public/
|- styles/
|- ONBOARDING_MIGRATION.sql
|- proxy.ts
|- next.config.mjs
|- package.json
|- .env.example
|- SETUP.md
|- DATABASE.md
|- API.md
```

## Environment Variables
Use `.env.local` for local development. A template exists in `.env.example`.

Required:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LifeFlow
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client-side code.
- Restart dev server after editing env vars.

## Getting Started (Local)
1. Clone repo
```bash
git clone <your-repo-url>
cd tm-lifeflow
```

2. Install dependencies
```bash
npm install
```

3. Configure environment
```bash
cp .env.example .env.local
```
Fill `.env.local` values from Supabase project settings.

4. Setup database
- Run SQL setup from `SETUP.md`
- Run `ONBOARDING_MIGRATION.sql` if onboarding policy fixes are needed

5. Start app
```bash
npm run dev
```

6. Open
- `http://localhost:3000`

## Database & Supabase Setup
Detailed docs are already included:
- `SETUP.md`: full project setup sequence
- `DATABASE.md`: schema reference, RLS, functions, triggers
- `ONBOARDING_MIGRATION.sql`: onboarding/profile policy fixes

### Minimum database expectations
- `profiles`, `tasks`, `tags`, `task_tags`, `subtasks`, `notifications`, `achievements`, `user_achievements`
- RLS enabled with user-scoped policies
- Functions used in app:
  - `award_xp(p_user_id uuid, p_xp int)`
  - `update_user_streak(p_user_id uuid)`

## Scripts
From `package.json`:

```bash
npm run dev     # start development server
npm run build   # production build
npm run start   # run production server
npm run lint    # lint project
```

## Deployment (GitHub + Vercel)
Yes, deploy flow is straightforward:
1. Push code to GitHub.
2. Import repo in Vercel.
3. Add environment variables in Vercel project settings.
4. Deploy.
5. In Supabase Auth settings, add your Vercel domain to Site URL and Redirect URLs.

After setup, pushes to your production branch auto-deploy.

## Known Notes
- `next.config.mjs` currently has `typescript.ignoreBuildErrors = true`.
  - Recommended: fix remaining TS errors and turn this off for stricter CI/CD.
- There are legacy files under `components/board/` that may not match current `components/lifeflow/` implementation.
- Admin UI pages exist, but verify their data source if you require fully live admin analytics.

## Contributing
Please check:
- `CONTRIBUTING.md`
- `API.md`
- `DATABASE.md`
- `SETUP.md`

---

If you want, I can also generate:
1. a shorter marketing-style README for visitors
2. a separate `README_DEV.md` only for setup/contributors
3. badges + screenshots section ready for GitHub top banner
