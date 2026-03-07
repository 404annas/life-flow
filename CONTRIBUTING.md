# CONTRIBUTING.md — LifeFlow

> Guidelines for contributing to LifeFlow, whether that's fixing bugs, adding features, or improving documentation.

---

## Getting Started

1. Fork the repo on GitHub
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/lifeflow.git`
3. Follow **SETUP.md** to get the dev environment running
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Push and open a PR

---

## Branch Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/short-description` | `feature/calendar-week-view` |
| Bug fix | `fix/what-was-broken` | `fix/drag-drop-mobile` |
| Documentation | `docs/what-changed` | `docs/api-reference` |
| Refactor | `refactor/what-changed` | `refactor/task-hooks` |

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

feat(board): add snap scrolling between kanban columns on mobile
fix(auth): prevent redirect loop when session expires during magic link
docs(setup): add Google OAuth configuration steps
refactor(tasks): extract task card into separate component
style(dashboard): adjust completion ring stroke width
```

**Types:** `feat` `fix` `docs` `refactor` `style` `test` `chore`

---

## Code Standards

### TypeScript
- No `any` types — use proper types from Supabase generated types or define your own
- All props interfaces should be named `ComponentNameProps`
- Use `type` not `interface` for simple prop objects

### Components
- Every interactive component must have `"use client"` at the top
- Server components fetch data directly — no `useEffect` for initial data loading
- Keep components focused: if a file exceeds ~150 lines, consider splitting it

### Styling
- Tailwind classes only — no inline styles, no separate CSS files (except `globals.css`)
- Follow the existing design system (colors, spacing, border radius)
- Mobile-first: write base styles for mobile, use `md:` and `lg:` for larger screens
- Use `cn()` utility for conditional class names

### Naming
- Components: `PascalCase` (`TaskCard.tsx`)
- Hooks: `camelCase` starting with `use` (`useTasks.ts`)
- Utilities: `camelCase` (`formatDate.ts`)
- Constants: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects

---

## File Structure Rules

- Components go in `/components/[feature]/ComponentName.tsx`
- Hooks go in `/lib/hooks/useHookName.ts`
- Helper functions go in `/lib/utils/`
- Constants go in `/lib/constants/`
- Page components only in `/app/` directories
- Never import from `@/app` inside `@/components` — components should be dumb

---

## Testing (Planned)

We don't have tests yet. If you'd like to add them:
- Unit tests: Vitest + Testing Library
- E2E tests: Playwright
- Place unit tests alongside the file: `TaskCard.test.tsx`
- Place E2E tests in `/e2e/`

---

## PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Write a clear description of what changed and why
- Include screenshots for UI changes (mobile + desktop)
- Make sure `npm run build` passes before submitting
- Make sure `npm run lint` has no errors

---

## Reporting Bugs

Open a GitHub issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser and device (mobile/desktop)
- Any error messages from the console

---

## Proposing Features

Open a GitHub discussion or issue tagged `enhancement` with:
- What problem it solves
- Rough description of how it would work
- Whether it fits within the Supabase free tier constraints

---

## Questions?

Open a GitHub Discussion or reach out via the project's contact links.
