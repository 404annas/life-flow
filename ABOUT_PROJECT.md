# ABOUT_PROJECT.md — LifeFlow

> Everything you need to understand what this project is, why it was built, and how it's designed.

---

## 🌊 What is LifeFlow?

**LifeFlow** is a modern, Gen-Z focused daily task management web app built as a full-stack project using Next.js, TypeScript, and Supabase. It's designed to be fast, beautiful, and actually enjoyable to use — filling the gap between overly complex project managers (Notion, Jira) and overly simple to-do apps (Apple Reminders).

The name "LifeFlow" represents the idea of getting into a productive flow state in your daily life — making task management feel natural and rewarding rather than a chore.

---

## 🎯 Target Audience

- **Primary:** Students and young professionals (18–28) who manage daily tasks, assignments, or personal goals
- **Secondary:** Anyone who finds apps like Notion too complex but wants more than a simple to-do list
- **Design philosophy:** Mobile-first because the target user lives on their phone

---

## 🧠 Design Decisions

### Why Next.js App Router?
The App Router enables server components, which means database queries run on the server with zero client-side waterfall. This makes the initial page load significantly faster — critical for mobile users on slower connections.

### Why Supabase?
- Free tier is genuinely generous (500MB DB, 50,000 MAU, 2GB storage)
- Built-in auth with multiple providers out of the box
- Row Level Security means we don't need to write custom auth middleware for every query
- Realtime subscriptions are built in — no extra infrastructure needed
- Postgres means full SQL power, functions, and triggers

### Why mobile-first?
Research consistently shows that task management apps are used most frequently on mobile — adding a task on the go, checking what's due, marking something complete. Desktop is used for planning sessions. The UI is designed around this — bottom navigation, large tap targets, swipe gestures, bottom sheet modals instead of centered dialogs.

### Why dark mode by default?
The Gen-Z demographic overwhelmingly prefers dark mode (studies show 80%+). Starting dark also makes glassmorphism effects look dramatically better — the blur and transparency effects that define the visual language of this app require a dark background to work properly.

### Why gamification?
Task apps have a retention problem — users set up the app, add some tasks, then abandon it. The streak system (borrowed from Duolingo), XP points, level progression, and achievements are designed to create a habit loop. Completing tasks should feel satisfying and rewarding, not like work.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│  Next.js App Router + React + Tailwind + shadcn/ui   │
│  React Query (cache) + Framer Motion (animations)    │
│  @dnd-kit (drag-drop) + Recharts (charts)            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│               Next.js Server (Vercel Edge)           │
│  Server Components + API Routes + Middleware         │
│  Server-side Supabase client for secure queries      │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    Supabase                          │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │  Auth   │ │ Postgres │ │Realtime  │ │ Storage │ │
│  │(JWT)    │ │ (RLS)    │ │(Websocket)│ │(Avatars)│ │
│  └─────────┘ └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────────────────┘
```

### Data Flow
1. User opens app → Next.js middleware checks for valid Supabase session cookie
2. If authenticated → server component fetches initial data from Supabase via server client
3. Data hydrates React Query cache → client components can read from cache instantly
4. User interactions → optimistic updates applied immediately, then synced to Supabase
5. Supabase Realtime pushes changes → React Query cache invalidated → UI updates

---

## 🎨 Design System

### Colors
```
Background:   #0a0a0f (near-black)
Surface:      #111118 (card backgrounds)
Border:       rgba(255,255,255,0.08) (subtle borders)
Primary:      #8b5cf6 (violet-500)
Primary Glow: #7c3aed (violet-600)
Success:      #22c55e (green-500)
Warning:      #f59e0b (amber-500)
Danger:       #ef4444 (red-500)
Text Primary: #f8fafc (slate-50)
Text Muted:   #94a3b8 (slate-400)
```

### Priority Colors
```
Urgent: #ef4444 (red)
High:   #f97316 (orange)
Medium: #eab308 (yellow)
Low:    #22c55e (green)
```

### Typography
- **Font:** Inter (weights: 400, 500, 600, 700, 800)
- **Headings:** 700–800 weight, tight letter-spacing
- **Body:** 400–500 weight, 1.5 line-height
- **Labels/Badges:** 500–600 weight, slightly wider letter-spacing

### Glassmorphism Recipe
```css
background: rgba(255, 255, 255, 0.04);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
```

### Spacing Scale
Following Tailwind's default 4px base unit. Cards use `p-4` (16px) on mobile, `p-6` (24px) on desktop.

---

## 📱 Responsive Breakpoints

| Breakpoint | Screen | Layout |
|------------|--------|--------|
| Default (mobile) | < 640px | Single column, bottom nav, full-width cards |
| sm | 640px+ | Slightly wider cards |
| md | 768px+ | 2-column grids start appearing |
| lg | 1024px+ | Sidebar appears, bottom nav hidden |
| xl | 1280px+ | Full desktop layout, wider sidebar |

---

## 🔐 Security Model

### Authentication
- Supabase handles all auth — JWTs are HTTP-only cookies (no localStorage)
- Sessions auto-refresh via `@supabase/ssr`
- Middleware validates session on every protected route request

### Authorization
- **Row Level Security (RLS)** is the primary authorization layer
- Every table has RLS enabled — even if a bug exposes a query, Postgres enforces access
- Users can only access their own data — queries without matching `user_id` return empty
- Admin access is checked via the `role` field in profiles table
- Service role key is only used server-side in admin API routes — never sent to the browser

### Data Privacy
- Admins can see aggregate stats but NOT individual task content
- Admin queries only touch the `profiles` table (username, email, streak, role)
- Task content is only accessible to the owning user via RLS

---

## ⚡ Performance Considerations

### React Query Caching
- `staleTime: 60000` — tasks are considered fresh for 60 seconds
- Background refetching keeps data up to date without blocking UI
- Optimistic updates make mutations feel instant

### Optimistic Updates
All drag-and-drop moves and status changes apply immediately in the UI before the server confirms. If the server fails, the update rolls back automatically.

### Code Splitting
Next.js App Router automatically code-splits by page. Heavy components (Recharts, Calendar) are only loaded when needed.

### Image Optimization
User avatars are served through `next/image` which automatically converts to WebP and serves the correct size for the device.

### Supabase Connection Pooling
Using `@supabase/ssr` on the server automatically handles connection management within Vercel's serverless function constraints.

---

## 🎮 Gamification System

### XP Points
| Action | XP Earned |
|--------|-----------|
| Create a task | +5 XP |
| Complete a task (on time) | +25 XP |
| Complete a task (early) | +35 XP |
| Complete a task (late) | +10 XP |
| Maintain a streak | +10 XP/day |
| Unlock an achievement | Varies (50–1000 XP) |

### Level Formula
```
Level = floor(totalXP / 500) + 1
```
So level 2 starts at 500 XP, level 3 at 1000 XP, level 10 at 4500 XP, etc.

### Streak Rules
- A streak counts when at least **1 task is completed** each calendar day
- The streak counter increments at the end of each active day
- A streak is broken if no task is completed by midnight (user's local time)
- Best streak is tracked separately and never resets

---

## 🗺️ Roadmap

### v1.0 (Current)
- Core task CRUD
- Kanban board with drag-and-drop
- Auth (email, Google, magic link)
- Streaks + XP
- Admin dashboard
- Mobile-first responsive design
- PWA support

### v1.1 (Planned)
- Collaboration — share task lists with other users
- Comments on tasks
- File attachments (Supabase Storage)
- Task templates

### v1.2 (Future)
- AI task suggestions (priority auto-detection from description)
- Natural language task creation ("Add task: dentist appointment tomorrow at 3pm")
- Weekly review mode
- Pomodoro timer built in

### v2.0 (Vision)
- Team workspaces
- Project management features (sprints, milestones)
- Time tracking
- Native mobile apps (React Native)

---

## 🤝 Who Built This?

LifeFlow was designed and built as a full-stack portfolio project demonstrating:
- Modern Next.js patterns (App Router, Server Components, Server Actions)
- Full Supabase integration (Auth, Postgres, RLS, Realtime, Storage)
- TypeScript-first development
- Mobile-first UI/UX design
- Production-grade code organization

---

## 📄 License

MIT License — free to use, modify, and deploy for personal and commercial projects.
