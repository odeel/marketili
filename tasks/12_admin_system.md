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

- [ ] **Add GET /admin/stats endpoint**
  - File: `backend/controllers/adminController.js`
  - Returns counts:
    - Users per role (client, agency, team, freelancer counts)
    - Posts: total, open, in_progress, closed
    - Pitches: total, pending, accepted, rejected
    - Projects: total, active, completed, cancelled
    - New registrations this week/month
  - Query all collections in parallel with `Promise.all`

- [ ] **Add GET /admin/posts endpoint (post moderation)**
  - File: `backend/routes/adminRoutes.js`
  - Returns all posts (not just open ones), paginated
  - Filter by status, clientId, dateRange
  - Includes client name and pitch count per post

- [ ] **Add PATCH /admin/posts/:id/remove endpoint**
  - Force-close a post and add a note (admin reason)
  - Sets `status: "closed"`, adds to `statusHistory` with `changedBy: "admin"`

- [ ] **Add dynamic options collection (OptionsList)**
  - File: new `backend/models/OptionsList.js`
  - Fields: `key: String` (e.g. "specialties", "regions", "categories"), `values: [String]`
  - Add CRUD: `GET /admin/options/:key`, `POST /admin/options/:key/add`, `DELETE /admin/options/:key/:value`
  - Frontend dropdowns for specialties/regions fetch from this collection instead of being hardcoded

---

## Frontend Tasks

- [ ] **Build admin statistics panel**
  - File: `AdminDashboard.js` — add a "Statistiques" tab
  - Display stat cards:
    - Total users (with per-role breakdown)
    - Active posts
    - Pitches this month
    - Active projects
  - Use simple number cards with MUI design (no chart library needed for MVP)

- [ ] **Build post moderation panel**
  - File: `AdminDashboard.js` — add a "Posts" tab
  - Table: client name, post title, status, pitch count, created date
  - Actions: "Supprimer" (force-close with reason modal)
  - Status filter and search

- [ ] **Build recent activity feed**
  - File: `AdminDashboard.js` — add to overview or separate "Activité" tab
  - List: recent registrations (last 10), recent posts created, recent pitches sent
  - Each item: role icon, name, action, timestamp

- [ ] **Build options management panel**
  - File: `AdminDashboard.js` — add "Options" tab
  - For each key (Spécialités, Régions, Catégories):
    - List current values with delete button
    - Input + "Ajouter" button to add new value
  - Changes reflect immediately in registration forms and post creation forms
