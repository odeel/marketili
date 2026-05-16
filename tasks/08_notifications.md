# Task 08 — Notifications

## What's Already Done
- Notification model with all types, categories, recipient info
- Static `Notification.notify()` method
- API endpoints: get (paginated), unread count, mark read, mark all read, delete
- notificationService.js exists on frontend (methods ready, no UI)

---

## Goals
- Wire `Notification.notify()` into every controller that should trigger one
- Build notification bell + dropdown panel on all dashboards
- Unread badge count visible at all times
- Notifications filterable by category (tasks, projects, contracts, pitches, deadlines)
- Urgency colors matching deadline system
- Only director sees contract and project-level notifications (not workers or commercial)

---

## Backend Tasks
*(Do this task before wiring notifications in tasks 03, 04, 05, 06, 07)*

- [ ] **Wire pitch notifications in pitchController**
  - File: `backend/controllers/Pitchcontroller.js`
  - In `sendPitch`: notify the client → type `pitch_received`, link to the post
  - In `acceptPitch`: notify the pitch sender (agency/freelancer/team) → type `pitch_accepted`
  - In `rejectPitch`: notify the pitch sender → type `pitch_rejected` with reason in body

- [ ] **Wire project notifications in projectController**
  - File: `backend/controllers/projectController.js`
  - In `createProject` (called on pitch accept): notify client → type `project_created`
  - In `updateTask` when status → `done`: notify director → type `project_milestone`
  - In project status → `completed`: notify client → type `project_completed`

- [ ] **Wire contract notifications in contractController**
  - File: `backend/controllers/contractController.js`
  - In `sendContract`: notify client → "Veuillez envoyer un reçu"
  - In `uploadReceipt`: notify agency director → "Reçu reçu"
  - In `sendBonDeCommande`: notify both parties → "Contrat finalisé"

- [ ] **Add `category` field to Notification model**
  - File: `backend/models/Notification.js`
  - Add: `category: { type: String, enum: ["tasks", "projects", "contracts", "pitches", "deadlines", "admin", "messages"], required: true }`
  - Set the appropriate category in each `Notification.notify()` call above

- [ ] **Add role-based filtering on GET /notifications**
  - File: `backend/controllers/notificationController.js` (create this file)
  - Already scoped by `recipient` ObjectId — no extra work needed
  - But: add `?category=` query param filter
  - Mount route: ensure `server.js` has `app.use("/api/notifications", require("./routes/notificationRoutes"))` (it was removed before — re-add now that the file exists)

---

## Frontend Tasks

- [ ] **Add notification bell to DashboardLayout topbar**
  - File: `frontend/src/components/layout/DashboardLayout.js`
  - Bell icon (MUI `NotificationsIcon`) in top-right
  - Red badge showing unread count (call GET /notifications/unread-count on mount)
  - Poll every 30 seconds or on window focus to update count

- [ ] **Build notification dropdown panel**
  - Clicking the bell opens a popover/drawer
  - Lists the 10 most recent notifications (GET /notifications?limit=10)
  - Each item: icon by category, title, body, timestamp (relative: "il y a 5 min")
  - Unread items highlighted with a subtle background
  - Clicking a notification: marks it read (PATCH /notifications/:id/read) + navigates to `link`
  - "Tout marquer comme lu" button at the top
  - "Voir toutes les notifications" link at the bottom

- [ ] **Build full notifications page**
  - File: new `frontend/src/pages/dashboard/NotificationsPage.js`
  - Full list, paginated
  - Filter tabs: Tous / Tâches / Projets / Contrats / Offres / Délais
  - Urgency color dot per notification:
    - Deadline < 3 days → red
    - Deadline 3–7 days → orange
    - Other → default

- [ ] **Add notifications route to all dashboards**
  - File: `ClientDashboard.js`, `AgencyDashboard.js`
  - Add nav item "Notifications" linking to the notifications page
  - Show unread badge on the nav item too
