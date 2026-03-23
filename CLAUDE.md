# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

The Next.js app lives entirely inside `uni-clases/`. All development commands must be run from that directory.

## Commands

```bash
cd uni-clases

# Install dependencies
npm.cmd install        # On Windows PowerShell use npm.cmd (npm.ps1 policy issues)
npm install            # On bash/WSL

# Dev server (localhost:3000)
npm.cmd run dev

# Production build
npm.cmd run build

# Lint
npm.cmd run lint
```

The `dev` and `build` scripts explicitly use `--webpack` (Turbopack is not used).

## Architecture

### Data modes

The app operates in one of two modes, selected at server startup via environment variables:

- **Local mode** (default, no env vars needed): Notes are stored in IndexedDB (`src/lib/idb.ts`); guestbook messages in `localStorage`. All data is per-browser.
- **Shared mode** (Supabase): Enabled when `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `REPORT_HASH_SALT` are all set. Notes and guestbook posts are global via Supabase Postgres. `page.tsx` detects this at request time (`export const dynamic = "force-dynamic"`) and passes `sharedEnabled` down to the client.

The mode switch is surfaced in `client-app.tsx`: it renders either `<NotesPanel>` / `<GuestbookPanel>` (local) or `<NotesPanelShared>` / `<GuestbookPanelShared>` (Supabase).

### Schedule data

All course and timetable data is hardcoded in `src/lib/schedule.ts`:
- `COURSES` — course definitions with id, name, professor, liveUrl, color.
- `WEEKLY_SLOTS` — recurring weekly schedule (weekday + startTime + duration).
- `sessionsForRange` / `sessionsForMonth` — expand slots into concrete `Session` objects for a date range.

To change courses or timeslots, edit only `src/lib/schedule.ts`.

### Hydration pattern

Because the app uses `Date` / `Intl` (locale-sensitive), SSR output would mismatch the client. `useHydrated` (`src/hooks/useHydrated.ts`) returns `false` on the server and on the first client render; `client-app.tsx` renders a blank div until hydrated, then mounts the real app.

### API routes (shared mode only)

All routes use `export const runtime = "nodejs"` and call Supabase directly via the thin REST wrapper in `src/lib/supabase-rest.ts` (no Supabase JS SDK).

| Route | Purpose |
|---|---|
| `GET /api/posts?type=note\|file` | Fetch visible or hidden posts |
| `POST /api/posts` | Create a post; returns a raw `deleteToken` stored by the client |
| `DELETE /api/posts/[id]/delete` | Owner-delete using the stored token (no accounts) |
| `POST /api/report` | Report a post; auto-hides after 5 reports via `HIDE_AFTER` constant |

Reporter identity for spam prevention is derived server-side from IP + User-Agent + `REPORT_HASH_SALT` (SHA-256 hash, never stored raw).

### Alerts system

`useClassAlerts` fires toasts (and optionally browser Notifications) keyed on `localStorage` flags (`uni_clases_daily_*`, `uni_clases_live_*`, `uni_clases_soon60_*`, `uni_clases_soon10_*`) so each alert fires at most once per session/class.

### Google Calendar integration

Optional. Enabled by setting `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Logic lives in `src/lib/google-calendar.ts`. Uses the Google Identity Services implicit flow (scope: `calendar.events`) to push all sessions for the current month.

## Environment variables

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Calendar button | Client-side |
| `NEXT_PUBLIC_SUPABASE_URL` | Shared mode | Client-side |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Shared mode (client reads) | Client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Shared mode (API routes) | Server-only — never expose |
| `REPORT_HASH_SALT` | Shared mode (reports + delete tokens) | Server-only |
