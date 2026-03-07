# FOLDER_STRUCTURE.md — LifeFlow

> The complete, annotated folder and file structure for the LifeFlow project.

---

```
lifeflow/
│
├── app/                                  # Next.js 14 App Router root
│   │
│   ├── (auth)/                           # Route group — no shared layout
│   │   ├── login/
│   │   │   └── page.tsx                  # Login page — renders LoginForm
│   │   ├── signup/
│   │   │   └── page.tsx                  # Signup page — renders SignupForm
│   │   ├── onboarding/
│   │   │   └── page.tsx                  # 3-step onboarding flow
│   │   └── callback/
│   │       └── route.ts                  # Supabase OAuth callback handler
│   │
│   ├── (dashboard)/                      # Route group — shares DashboardLayout
│   │   ├── layout.tsx                    # Bottom nav (mobile) + sidebar (desktop)
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Today view — stats, rings, today's tasks
│   │   ├── board/
│   │   │   └── page.tsx                  # Kanban board view
│   │   ├── calendar/
│   │   │   └── page.tsx                  # Calendar view (monthly + weekly)
│   │   └── profile/
│   │       └── page.tsx                  # Profile + settings page
│   │
│   ├── admin/                            # Admin-only pages (role-gated in middleware)
│   │   ├── layout.tsx                    # Admin sidebar layout
│   │   ├── overview/
│   │   │   └── page.tsx                  # Stats overview (server component)
│   │   ├── users/
│   │   │   └── page.tsx                  # User management table
│   │   └── analytics/
│   │       └── page.tsx                  # Charts and trends
│   │
│   ├── api/                              # Next.js API Routes (server-side only)
│   │   ├── admin/
│   │   │   ├── stats/
│   │   │   │   └── route.ts              # GET /api/admin/stats
│   │   │   └── users/
│   │   │       ├── route.ts              # GET /api/admin/users
│   │   │       └── [id]/
│   │   │           ├── route.ts          # GET /api/admin/users/:id
│   │   │           └── deactivate/
│   │   │               └── route.ts      # POST /api/admin/users/:id/deactivate
│   │   └── export/
│   │       └── route.ts                  # GET /api/export (CSV export)
│   │
│   ├── layout.tsx                        # Root layout (fonts, providers, metadata)
│   ├── globals.css                       # Tailwind directives + global CSS vars
│   ├── not-found.tsx                     # Custom 404 page
│   └── error.tsx                         # Global error boundary
│
├── components/
│   │
│   ├── ui/                               # shadcn/ui base components (don't edit)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── sheet.tsx
│   │   ├── progress.tsx
│   │   ├── tabs.tsx
│   │   ├── avatar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── popover.tsx
│   │   ├── calendar.tsx
│   │   └── ... (other shadcn components)
│   │
│   ├── auth/                             # Authentication components
│   │   ├── LoginForm.tsx                 # Email/pass + Google + magic link
│   │   ├── SignupForm.tsx                # Registration form
│   │   └── OnboardingFlow.tsx            # 3-step new user setup
│   │
│   ├── dashboard/                        # Home/Today view components
│   │   ├── GreetingHeader.tsx            # "Good morning, Alex 👋" + streak badge
│   │   ├── StatsRow.tsx                  # Horizontal scrollable stat cards
│   │   ├── CompletionRings.tsx           # Apple Watch-style progress rings
│   │   ├── TodayTaskList.tsx             # Today's task list with timeline
│   │   ├── EndOfDaySummary.tsx           # Modal shown at day end
│   │   └── FocusMode.tsx                 # Distraction-free single task view
│   │
│   ├── tasks/                            # Task-related components
│   │   ├── TaskCard.tsx                  # Task card used in Kanban + list views
│   │   ├── TaskModal.tsx                 # Full task detail/edit dialog
│   │   ├── TaskForm.tsx                  # Create/edit task form
│   │   ├── QuickAddSheet.tsx             # Bottom sheet for fast task creation
│   │   ├── SubtaskList.tsx               # Checklist of subtasks within a task
│   │   ├── PriorityBadge.tsx             # Color-coded priority indicator
│   │   ├── StatusBadge.tsx               # Status chip component
│   │   ├── TagPill.tsx                   # Colored tag label
│   │   └── TaskSearch.tsx                # Search bar with results dropdown
│   │
│   ├── board/                            # Kanban board components
│   │   ├── KanbanBoard.tsx               # DndContext wrapper, column orchestration
│   │   ├── KanbanColumn.tsx              # Single droppable column
│   │   └── FilterBar.tsx                 # Priority filter chips + view toggle
│   │
│   ├── calendar/                         # Calendar view components
│   │   ├── CalendarView.tsx              # Monthly calendar with task dots
│   │   ├── WeekView.tsx                  # Weekly time-slot view
│   │   └── DayTaskList.tsx               # Timeline list for selected day
│   │
│   ├── profile/                          # Profile and settings components
│   │   ├── ProfileHeader.tsx             # Avatar, name, XP level
│   │   ├── StatsGrid.tsx                 # 2x2 stats grid (tasks, streak, etc.)
│   │   ├── AchievementsRow.tsx           # Horizontal scrollable achievement badges
│   │   └── SettingsList.tsx              # Grouped settings rows
│   │
│   ├── admin/                            # Admin dashboard components
│   │   ├── StatsOverview.tsx             # 4-card stats row with trend arrows
│   │   ├── UserTable.tsx                 # Searchable/sortable user table
│   │   ├── SignupsChart.tsx              # Line chart: signups over time
│   │   ├── TaskActivityChart.tsx         # Bar chart: created vs completed
│   │   ├── StatusDonutChart.tsx          # Donut chart: task status distribution
│   │   └── ActivityFeed.tsx              # Live-feel recent events list
│   │
│   ├── layout/                           # App shell components
│   │   ├── BottomNav.tsx                 # Mobile bottom navigation bar
│   │   ├── Sidebar.tsx                   # Desktop collapsible sidebar
│   │   ├── Header.tsx                    # Top bar (greeting, notifications, search)
│   │   ├── AdminSidebar.tsx              # Admin-specific sidebar
│   │   └── NotificationPanel.tsx         # Notification dropdown/sheet
│   │
│   └── shared/                           # Truly reusable cross-feature components
│       ├── EmptyState.tsx                # Illustrated empty state with CTA
│       ├── SkeletonCard.tsx              # Loading skeleton for task cards
│       ├── SkeletonStats.tsx             # Loading skeleton for stats
│       ├── ConfirmDialog.tsx             # Generic confirmation dialog
│       ├── GradientText.tsx              # Gradient-colored text component
│       └── GlassCard.tsx                 # Reusable glassmorphism card wrapper
│
├── lib/
│   │
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client (singleton)
│   │   ├── server.ts                     # Server Supabase client (per-request)
│   │   ├── admin.ts                      # Admin Supabase client (service role)
│   │   └── types.ts                      # Auto-generated from: supabase gen types
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useAuth.ts                    # signIn, signUp, signOut, signInWithGoogle
│   │   ├── useProfile.ts                 # useProfile(), useUpdateProfile()
│   │   ├── useTasks.ts                   # useTasks(), useCreateTask(), useUpdateTask(), useDeleteTask()
│   │   ├── useSubtasks.ts                # useCreateSubtask(), useToggleSubtask()
│   │   ├── useTags.ts                    # useTags(), useCreateTag(), useDeleteTag()
│   │   ├── useNotifications.ts           # useNotifications(), useMarkAllRead()
│   │   ├── useAchievements.ts            # useAchievements(), useUserAchievements()
│   │   ├── useStreak.ts                  # Streak display + XP state
│   │   ├── useTaskStats.ts               # Daily/weekly completion stats
│   │   ├── useTaskSearch.ts              # Full-text task search
│   │   └── useRealtime.ts               # Supabase Realtime subscription setup
│   │
│   ├── queries/                          # Raw query functions (used by hooks)
│   │   ├── tasks.ts                      # fetchTasks, fetchTaskById, etc.
│   │   ├── profile.ts                    # fetchProfile
│   │   └── admin.ts                      # fetchAdminStats, fetchAllUsers
│   │
│   ├── utils/                            # Pure helper functions
│   │   ├── cn.ts                         # clsx + tailwind-merge utility
│   │   ├── formatDate.ts                 # Date formatting helpers (using date-fns)
│   │   ├── formatTime.ts                 # Time formatting helpers
│   │   ├── priorityHelpers.ts            # Priority → color/label mappings
│   │   ├── statusHelpers.ts              # Status → color/label mappings
│   │   ├── xpHelpers.ts                  # XP → level calculations
│   │   └── csvExport.ts                  # Task data → CSV string
│   │
│   └── constants/
│       ├── priorities.ts                 # Priority enum values and metadata
│       ├── statuses.ts                   # Status enum values and metadata
│       ├── achievements.ts               # Achievement keys and display info
│       └── routes.ts                     # App route path constants
│
├── types/                                # Global TypeScript type definitions
│   ├── database.ts                       # Re-exports from lib/supabase/types.ts
│   └── app.ts                            # App-specific types (not from DB)
│
├── providers/                            # React context providers
│   ├── QueryProvider.tsx                 # React Query client provider
│   ├── ThemeProvider.tsx                 # Dark/light mode provider
│   └── AuthProvider.tsx                  # Auth state context (optional)
│
├── public/                               # Static assets (served as-is)
│   ├── manifest.json                     # PWA manifest
│   ├── sw.js                             # Service worker (generated by next-pwa)
│   ├── icons/                            # PWA icons (72x72 to 512x512)
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── images/
│       ├── empty-state-tasks.svg         # Empty state illustration
│       ├── empty-state-calendar.svg
│       └── onboarding-*.svg              # Onboarding screen illustrations
│
├── middleware.ts                         # Route protection + role checks
├── next.config.ts                        # Next.js + PWA configuration
├── tailwind.config.ts                    # Tailwind config with custom colors/fonts
├── tsconfig.json                         # TypeScript config with path aliases
├── .eslintrc.json                        # ESLint config
├── .prettierrc                           # Prettier config
├── .gitignore
├── .env.example                          # Template for environment variables
├── .env.local                            # Your actual secrets (gitignored)
├── package.json
│
├── README.md                             # Project overview + quick start
├── SETUP.md                              # Complete setup guide (this file's companion)
├── ABOUT_PROJECT.md                      # Design decisions, architecture, roadmap
├── DATABASE.md                           # Schema reference + SQL
├── API.md                                # Hook and API route reference
├── CONTRIBUTING.md                       # Contribution guidelines
└── FOLDER_STRUCTURE.md                   # This file
```

---

## Key Conventions

### Route Groups
The `(auth)` and `(dashboard)` folders are Next.js **route groups** — the parentheses mean the folder name is NOT part of the URL. So:
- `app/(auth)/login/page.tsx` → accessible at `/login`
- `app/(dashboard)/board/page.tsx` → accessible at `/board`

Route groups let us share a layout (like the sidebar/bottom nav) without affecting the URL structure.

### Server vs Client Components
- Files in `app/` without `"use client"` → Server Components by default
- All hooks-using components must have `"use client"` at the very top
- Data fetching in server components = zero client-side waterfall
- Prefer server components for the initial page render, client components for interactivity

### The `lib/` folder
Think of `lib/` as the backend of your frontend:
- `supabase/` → database access
- `hooks/` → data fetching + mutations (used by client components)
- `queries/` → raw async functions (used by hooks, testable independently)
- `utils/` → pure functions (no side effects, no React)
- `constants/` → values that never change at runtime
