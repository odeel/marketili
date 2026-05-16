# Task 12 — Admin System

## What's Already Done
- Admin dashboard: user list with role filter + search + toggle active
- GET /admin/users (role, search filters)
- PATCH /admin/users/:role/:id/toggle (enable/disable accounts)
- adminOnly middleware

---

## Goals
- Monitor and moderate posts (flag, remove, feature)
- Platform statistics (users count, posts, pitches, projects by status)
- Ability to add new dropdown options (specialties, categories, regions) without code changes
- Monitor platform activity (recent registrations, recent posts, recent pitches)
- Manage ads/featured listings (future, low priority)

---

## Backend Tasks

- [x] **Add GET /admin/stats endpoint**
  - Returns counts: users per role, posts by status, pitches by status, projects by status
  - New registrations this week/month, posts this week/month
  - All queries run in parallel with Promise.all

- [x] **Add GET /admin/posts endpoint (post moderation)**
  - Returns all posts paginated with client name and pitch count
  - Filter by status, search by title
  - Pitch count via aggregate pipeline

- [x] **Add PATCH /admin/posts/:id/remove endpoint**
  - Sets status: "closed", saves adminNote reason
  - Added adminNote field to Post model

- [x] **Add dynamic options collection (OptionsList)**
  - Model: `backend/models/OptionsList.js` — key, values[], label
  - CRUD: GET /admin/options, GET /admin/options/:key, POST /admin/options/:key/add, DELETE /admin/options/:key/:value
  - GET /admin/activity — recent registrations, posts, pitches

---

## Frontend Tasks

- [x] **Build admin statistics panel**
  - "Statistiques" tab with grouped stat cards
  - Users (total + per role), Posts (total/open/in_progress/closed)
  - Pitches (total/pending/accepted/rejected), Projects (total/active/completed/cancelled)

- [x] **Build post moderation panel**
  - "Posts" tab: paginated table with client name, status, pitch count, date
  - "Retirer" action with animated reason modal (force-close)
  - Status filter + title search

- [x] **Build recent activity feed**
  - "Activité" tab: recent registrations (with role color badges), recent posts, recent pitches
  - Relative timestamps (il y a Xmin/h/j)

- [x] **Build options management panel**
  - "Options" tab: Spécialités, Régions, Catégories
  - Per-group: chip list with × delete + add form
  - Changes persist immediately via OptionsList model
