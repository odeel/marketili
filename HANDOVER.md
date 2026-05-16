# HANDOVER.md — Session Summary

> Read this at the start of a new session. Gives you the full context without re-reading everything.

---

## What This Project Is

**Marketili** — a fullstack marketplace platform for marketing collaboration in Algeria.
Connects clients (businesses) with agencies, creative teams, and freelancers.
Full lifecycle: publish brief → pitch → accept → project → tasks → contracts → deliverables.

**Stack:** React (CRA, no TypeScript) + Express.js + MongoDB Atlas + Mongoose + JWT (HTTP-only cookies)

**Repo:** `c:\Users\admin\Desktop\try1`
**Active branch:** `yacine-fixes`

---

## How to Run

Always two terminals:

```
# Terminal 1 — Backend
cd backend
node server.js
# Should print: ✅ MongoDB connected + ✅ GridFS initialized + 🚀 running on port 5000

# Terminal 2 — Frontend
cd frontend
npm start
# Runs on http://localhost:3000
```

**First time only:** copy root `.env` into backend folder:
```
copy .env backend\.env
```

Full details in `HOWTO_RUN.md`.

---

## Current State — What's Working

- ✅ Server starts without errors
- ✅ MongoDB Atlas connects (cloud-hosted, no local DB needed)
- ✅ CORS fixed (was blocking all API calls)
- ✅ Multi-role auth: register, login, logout, /me — all 7 roles working
- ✅ Posts: create, browse, filter, close, reactivate, delete
- ✅ Pitches: send (with file upload), accept (auto-creates project), reject
- ✅ Projects: auto-created on pitch accept, tasks, members, progress tracking
- ✅ Contracts: full workflow draft → sent → receipt → bon de commande → signed
- ✅ Agency dashboard: director / commercial / worker split views
- ✅ Client dashboard: posts, pitches received, projects, contracts
- ✅ Admin dashboard: user list, search, toggle active
- ✅ Agency member management: create, list, toggle, force password change

---

## What Was Fixed This Session

| Fix | File | Problem |
|-----|------|---------|
| Wrong middleware import | `backend/routes/uploadRoutes.js` | Was importing `authMiddleware` — file is named `auth.js` — crashed server on startup |
| CORS preflight not handled | `backend/server.js` | Added explicit `app.options("/{*path}", cors(...))` and `allowedHeaders` — all API calls were blocked |
| Express 5 wildcard syntax | `backend/server.js` | `*` → `/{*path}` — Express 5 uses path-to-regexp v8 which rejects bare `*` |
| Frontend port conflict | `frontend/.env` | Created with `PORT=3000` — CRA was defaulting to 5000 (backend port) |
| `*.md` in .gitignore | `.gitignore` | Removed — was hiding all documentation files from git |

---

## Files Created This Session

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Codebase guide for Claude Code — read automatically each session |
| `HOWTO_RUN.md` | Step-by-step setup and run instructions |
| `PROJECT_STATUS.md` | Full gap analysis: what's implemented vs what the spec requires |
| `tasks/00_INDEX.md` | Task build order with priorities |
| `tasks/01_auth_registration.md` | Auth & registration completion tasks |
| `tasks/02_posts.md` | Posts feature completion tasks |
| `tasks/03_pitches.md` | Pitches feature completion tasks |
| `tasks/04_projects.md` | Projects feature completion tasks |
| `tasks/05_tasks.md` | Tasks (inside projects) completion tasks |
| `tasks/06_contracts.md` | Contracts feature completion tasks |
| `tasks/07_agency_workflow.md` | Agency internal workflow tasks |
| `tasks/08_notifications.md` | Notification system tasks |
| `tasks/09_profiles.md` | Public profiles & browse providers tasks |
| `tasks/10_freelancer_dashboard.md` | Full freelancer dashboard tasks |
| `tasks/11_team_dashboard.md` | Full team dashboard tasks |
| `tasks/12_admin_system.md` | Admin system expansion tasks |
| `tasks/13_dashboards_calendar.md` | Calendar, todo, global filters tasks |
| `tasks/14_collaboration_lifecycle.md` | Worker lifecycle & soft-delete tasks |
| `tasks/landing_page_content.md` | Landing page full content definition (all sections, copy, structure) |

---

## Where to Start Next

**Open `tasks/00_INDEX.md` first** — it has the full priority order.

The next task to work on is **`tasks/01_auth_registration.md`**:

Quick summary of what's missing there:
- Backend: add `carteAutoEntrepreneur` to Freelancer model, filiale/parent fields to Agency model, price min≤max validation, stricter name validation
- Frontend: agency specialties picker in register form, filiale toggle, freelancer carte field, replace free-text fields with dropdowns

After that: `tasks/02_posts.md` (missing fields on Post model + filter UI + deadline color utility).

**Rule:** Always finish all backend tasks in a file before starting its frontend tasks. Commit after each completed task file.

---

## Key Technical Rules (Never Break These)

- **axios stays at `0.27.2`** — newer versions break CRA webpack. Never upgrade.
- **No `next` parameter in Mongoose async pre-save hooks** — causes `next is not a function` crash at runtime
- **Never mix `exports.X` and `module.exports = {...}` in the same file** — second one silently overwrites first
- **Route order in Express matters** — specific routes before generic: `/pitches/my` before `/pitches/:id`
- **File casing** — model files use PascalCase (`AgencyMember.js`) but actual file on disk may differ (`Agencymember.js`). Windows ignores this, Linux crashes. Always match exactly.
- **Never hard-delete** users, pitches, projects, tasks, contracts — always soft-delete (archive/inactive/cancelled)
- **No Redux, no Zustand, no Context, no localStorage** — state via hooks + services only
- **No free-text fields** when dropdowns/selectors are possible — spec requirement
- **No emojis in dashboards** — spec requirement
- **Frontend labels in French, internal code variable names in English**
- **`connectDB()` must be called before any model is used** — already correct in server.js

---

## Project Structure (Quick Reference)

```
try1/
├── backend/
│   ├── config/db.js          ← MongoDB + GridFS setup
│   ├── controllers/          ← Business logic (7 files)
│   ├── middleware/auth.js    ← JWT verify, protect, authorize, adminOnly
│   ├── models/               ← 12 Mongoose schemas
│   ├── routes/               ← 9 route files
│   └── server.js             ← Entry point, CORS, route mounting
├── frontend/src/
│   ├── App.js                ← All routes + PrivateRoute guards
│   ├── hooks/                ← useAuth (singleton), usePosts, usePitches
│   ├── pages/                ← ClientDashboard, AgencyDashboard, AdminDashboard, auth pages
│   ├── services/             ← Axios API clients (one per feature)
│   └── components/           ← PitchForm, OffresRecues, CreatePostModal, PostsDataGrid, DashboardLayout
├── tasks/                    ← All task files (start with 00_INDEX.md)
├── .env                      ← Root env (must also be copied to backend/.env)
├── frontend/.env             ← PORT=3000 (keeps frontend off backend's port)
├── CLAUDE.md                 ← Codebase guide
├── HOWTO_RUN.md              ← Run instructions
└── PROJECT_STATUS.md         ← Full feature gap analysis
```

---

## API Base URLs

- Backend: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`
- Frontend: `http://localhost:3000`

---

## Commit Convention

```
feat: complete task 01 — auth registration
feat: complete task 02 — posts
fix: <what broke and what was fixed>
chore: <non-feature work>
```

Always commit to `yacine-fixes` branch (currently active).
Push with: `git push` (tracking is already set up).
