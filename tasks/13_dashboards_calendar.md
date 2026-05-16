# Task 13 — Dashboards General: Calendar, Todo & Filters

## What's Already Done
- WorkerCalendar exists (calendar view for agency workers)
- All dashboards have sidebar navigation structure
- usePosts hook supports filters (status, region, category, search, sort)

---

## Goals
- Every user role has a calendar showing their task due dates and project deadlines
- Personal todo list / reminders / pinned tasks / quick notes per user (separate from project tasks)
- Everything searchable and filterable: status, date, region, sorting
- Closest deadline first ordering enforced everywhere
- Urgency color system consistent across the entire app

---

## Backend Tasks

- [ ] **Add PersonalNote / Todo model**
  - File: new `backend/models/PersonalNote.js`
  - Fields: `owner` (ObjectId), `ownerRole`, `text`, `isPinned`, `isReminder`, `reminderDate`, `isDone`, `createdAt`
  - CRUD routes: `GET /notes`, `POST /notes`, `PATCH /notes/:id`, `DELETE /notes/:id`
  - All protected, scoped to `req.user._id`
  - Mount in `server.js`

- [ ] **Add GET /calendar/:role/:id endpoint**
  - File: new `backend/routes/calendarRoutes.js`
  - Returns a combined list of calendar events:
    - Projects: `{ type: "project", title, deadline, status, projectId }`
    - Tasks: `{ type: "task", title, dueDate, status, taskId, projectId }`
    - Personal reminders: `{ type: "reminder", text, reminderDate }`
  - Sorted by date ascending

---

## Frontend Tasks

- [ ] **Create deadline urgency utility (shared)**
  - File: `frontend/src/utils/deadlineColor.js`
  - `getDeadlineColor(date)` → returns `{ color, label }`:
    - No date → `{ color: "#9e9e9e", label: "Pas de délai" }`
    - > 14 days → `{ color: "#4caf50", label: "Dans les temps" }`
    - 7–14 days → `{ color: "#ffeb3b", label: "Bientôt" }`
    - 3–7 days → `{ color: "#ff9800", label: "Urgent" }`
    - < 3 days or past → `{ color: "#f44336", label: "Critique" }`
  - Import this in ALL task/project/post card components

- [ ] **Add calendar to client dashboard**
  - File: new `frontend/src/pages/dashboard/client/ClientCalendar.js`
  - Month view (use a simple MUI-based calendar or build from scratch)
  - Dots on days that have project deadlines or task due dates
  - Click a day → sidebar shows events for that day
  - Add "Calendrier" to client dashboard sidebar nav

- [ ] **Add calendar to agency director dashboard**
  - File: new `frontend/src/pages/dashboard/agency/DirectorCalendar.js`
  - Shows all project deadlines and all team task due dates
  - Color-coded by urgency
  - Add "Calendrier" to director sidebar nav

- [ ] **Add calendar to freelancer dashboard** (do after task 10)
  - Similar to worker calendar
  - Shows tasks and project deadlines for current context (independent or agency)

- [ ] **Build personal todo / notes widget**
  - File: new `frontend/src/components/shared/PersonalNotes.js`
  - Small panel available from every dashboard (sidebar or floating widget)
  - Add note (text input + optional reminder date + pin toggle)
  - List notes: pinned first, then by createdAt desc
  - Mark done → strikethrough + grey out
  - Delete note

- [ ] **Enforce filter bars on all major lists**
  - Posts list: status, marketingType, region, compensationType, search, sort
  - Pitches list: status, date range, sort
  - Projects list: status, deadline range, sort
  - Tasks list: status, priority, assignee, due date range
  - Each filter bar uses dropdowns/selectors (no free text except search)
