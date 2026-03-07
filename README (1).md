# LifeFlow 🌊
### A Modern, Gen-Z Focused Task Management App

![LifeFlow Banner](https://via.placeholder.com/1200x400/0a0a0f/8b5cf6?text=LifeFlow+%E2%80%94+Task+Management+Reimagined)

> **Stack:** Next.js 14+ · TypeScript · Supabase · Tailwind CSS · Framer Motion · shadcn/ui

---

## 📖 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

---

## About the Project

LifeFlow is a **mobile-first**, **dark-mode-default** daily task manager designed for the modern Gen-Z user. It combines the simplicity of a to-do app with the power of a full project management tool — complete with Kanban boards, calendar views, streaks, XP gamification, and an admin dashboard.

Built entirely on the **Supabase free tier**, it's designed to be self-hostable, portfolio-ready, and genuinely useful in daily life.

---

## Features

### 👤 User Features
- ✅ Email/Password, Google OAuth & Magic Link authentication
- ✅ Kanban board with drag-and-drop (Pending → In Progress → Completed)
- ✅ Task fields: title, description, due date, due time, priority, status, tags, subtasks
- ✅ Calendar view (monthly + weekly)
- ✅ Today view — focused daily task list
- ✅ Daily streak counter & XP points system
- ✅ Completion rings (daily/weekly goal progress)
- ✅ Focus mode — distraction-free single task view
- ✅ Quick-add floating button with bottom sheet
- ✅ Push notifications & due-soon alerts
- ✅ Profile customization (avatar color, accent theme)
- ✅ Achievements & badges
- ✅ Export tasks as CSV
- ✅ Full-text task search
- ✅ PWA — installable on mobile home screen

### 🛡️ Admin Features
- ✅ Overview dashboard (total users, DAU, tasks created/completed)
- ✅ User management table (search, filter, deactivate)
- ✅ Charts: signups over time, task completion rates, status distribution
- ✅ Recent activity feed
- ✅ Privacy-first: no access to individual task content

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend & DB | Supabase (Auth, Postgres, Realtime, Storage) |
| Animations | Framer Motion |
| Drag & Drop | @dnd-kit/core |
| Charts | Recharts |
| Data Fetching | TanStack React Query |
| Notifications | Sonner (toasts) |
| Icons | Lucide React |
| PWA | next-pwa |

---

## Getting Started

See [SETUP.md](./SETUP.md) for the complete step-by-step setup guide.

**Quick start:**
```bash
git clone https://github.com/yourusername/lifeflow.git
cd lifeflow
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

---

## Project Structure

```
lifeflow/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth route group (no layout)
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/
│   ├── (dashboard)/            # Protected route group
│   │   ├── dashboard/          # Today view + stats
│   │   ├── board/              # Kanban board
│   │   ├── calendar/           # Calendar view
│   │   └── profile/            # Profile + settings
│   ├── admin/                  # Admin-only pages
│   │   ├── overview/
│   │   ├── users/
│   │   └── analytics/
│   ├── api/                    # API route handlers
│   │   ├── tasks/
│   │   ├── auth/
│   │   └── admin/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── auth/                   # Auth forms
│   ├── tasks/                  # Task cards, modals, forms
│   ├── board/                  # Kanban board components
│   ├── calendar/               # Calendar components
│   ├── dashboard/              # Stats, rings, widgets
│   ├── admin/                  # Admin dashboard components
│   ├── layout/                 # Sidebar, bottom nav, header
│   └── shared/                 # Reusable shared components
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client
│   │   └── types.ts            # Generated DB types
│   ├── hooks/                  # Custom React hooks
│   │   ├── useTasks.ts
│   │   ├── useProfile.ts
│   │   ├── useStreak.ts
│   │   └── useRealtime.ts
│   ├── queries/                # React Query query functions
│   ├── utils/                  # Helper functions
│   └── constants/              # App-wide constants
├── types/                      # Global TypeScript types
├── public/                     # Static assets
├── middleware.ts               # Auth + role middleware
├── .env.example
├── .env.local                  # Your actual secrets (gitignored)
├── README.md
├── SETUP.md
├── ABOUT_PROJECT.md
├── DATABASE.md
├── API.md
└── CONTRIBUTING.md
```

---

## Environment Variables

See [.env.example](./.env.example) for all required variables.

---

## Database Schema

See [DATABASE.md](./DATABASE.md) for the complete schema, RLS policies, and SQL setup.

---

## License

MIT — feel free to use this as a portfolio project or starting point for your own app.

---

<p align="center">Built with 💜 using Next.js + Supabase</p>
