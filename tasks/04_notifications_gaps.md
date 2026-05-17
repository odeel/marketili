# Task 04 — Notification Gaps

**Priority:** 🟠 Priority 2
**Depends on:** nothing (Task 01 chat makes some triggers easier but not required)
**Blocks:** Task 05 (invite notification)

---

## Why This Exists

The notification system is structurally complete (19 types, categories, isRead, mark-all-read). However:

1. **Director-only filter not enforced**: The spec says "only director sees contract and project notifications". Currently all notification types are delivered to any recipient without a role check. A commercial member or worker would also receive contract notifications if one were accidentally sent to them.

2. **Missing triggers**: Some notification events are defined as types in the model but never fired from any controller:
   - `collaboration_request` — never triggered (needed for Task 05)
   - `account_restored` — never triggered (setMemberStatus to active has no notification)
   - `director_approval_needed` — should fire when a strategist sends a pitch `with_chef_de_projet` or when a chef sends it `approved`

3. **No deadline approaching / overdue polling**: `task_overdue` and `deadline_approaching` types exist but are never triggered because there is no scheduled job or cron to check them.

---

## Backend Work

### 1. Director-only contract/project notifications

In `backend/controllers/notificationController.js` (or wherever `Notification.notify()` is called):

**Rule to implement:**
When creating a notification of category `"contracts"` or `"projects"` for an agency, check if the recipient is a director (`jobTitle === "director"`). If the agency_member is not a director, do not create those notification categories for them.

Concretely, in `contractController.js` and `projectController.js`, when calling `Notification.notify()`, pass `recipientRole: "agency"` only for director-level events. For agency_members who are workers or commercial, only send `"tasks"` and `"deadlines"` categories.

**Where to apply:**
- `contractController.js`: all contract status-change notifications to agency side → only create if recipient is director
- `projectController.js`: project_created, project_completed notifications to agency → only director

### 2. Add missing notification trigger: `account_restored`

In `backend/controllers/agencyMemberController.js`, `setMemberStatus()`:
- When `accountStatus` is set to `"active"` and was previously something else:
  - Trigger notification to the member: `type: "system"`, title: "Votre compte a été réactivé", body: "Votre accès à la plateforme a été restauré."

### 3. Add missing notification trigger: `director_approval_needed`

In `backend/controllers/Pitchcontroller.js`, `updateInternalStatus()`:
- When `internalStatus` changes to `"with_chef_de_projet"`:
  - Find the `chef_de_projet` member in the agency
  - Trigger notification to chef_de_projet: `type: "director_approval_needed"`, `category: "pitches"`, title: "Pitch à valider", body: "Un pitch vous a été soumis pour validation."
- When `internalStatus` changes to `"approved"`:
  - Find the `director` member in the agency
  - Trigger notification to director: `type: "director_approval_needed"`, `category: "pitches"`, title: "Pitch approuvé — prêt à envoyer", body: "Le chef de projet a validé le pitch."

### 4. Deadline approaching — scheduled check (simple approach)

Rather than a real cron job, implement a lightweight check endpoint that can be called on each dashboard load:

New endpoint: `GET /api/notifications/check-deadlines`

Logic:
- For the current user (from JWT), find all their projects and tasks with deadline within 3 days
- For each, if no `deadline_approaching` notification exists for that item in the last 24h, create one
- Return count of new notifications created

Call this from the frontend on dashboard mount (once per session, not on every poll).

---

## Frontend Work

### 1. Call deadline check on dashboard mount

In each dashboard's top-level component (ClientDashboard, AgencyDashboard, FreelancerDashboard, TeamDashboard), add a `useEffect` on mount:

```js
useEffect(() => {
  notificationService.checkDeadlines();
}, []);
```

New service method: `notificationService.checkDeadlines()` → GET `/notifications/check-deadlines`

### 2. Notification category labels in UI

In `frontend/src/pages/dashboard/NotificationsPage.js`, ensure all 7 categories are shown as filter chips: Tâches, Projets, Contrats, Pitches, Échéances, Admin, Messages.

Verify that the existing category filter renders the correct French label for each category key.

---

## Files to Modify

```
backend/controllers/contractController.js
    - Add director-only check before creating agency-side contract notifications

backend/controllers/projectController.js
    - Add director-only check before creating agency-side project notifications

backend/controllers/agencyMemberController.js
    - ADD notification trigger in setMemberStatus() when status → "active"

backend/controllers/Pitchcontroller.js
    - ADD chef_de_projet notification on internalStatus → "with_chef_de_projet"
    - ADD director notification on internalStatus → "approved"

backend/routes/notificationRoutes.js
    - ADD GET /check-deadlines route

backend/controllers/notificationController.js
    - ADD checkDeadlines() endpoint

frontend/src/services/notificationService.js
    - ADD checkDeadlines() method

frontend/src/pages/dashboard/ClientDashboard.js
    - ADD checkDeadlines() call on mount

frontend/src/pages/dashboard/AgencyDashboard.js
    - ADD checkDeadlines() call on mount

frontend/src/pages/dashboard/FreelancerDashboard.js
    - ADD checkDeadlines() call on mount

frontend/src/pages/dashboard/TeamDashboard.js
    - ADD checkDeadlines() call on mount
```

---

## Acceptance Criteria

- [ ] Agency commercial/worker members do NOT receive contract or project category notifications
- [ ] Agency director DOES receive contract and project category notifications
- [ ] When a member account is restored (status → active), that member receives a system notification
- [ ] When pitch moves to `with_chef_de_projet`, chef de projet receives a notification
- [ ] When pitch moves to `approved`, director receives a notification
- [ ] Approaching deadlines (within 3 days) trigger a `deadline_approaching` notification on dashboard load
- [ ] All 7 category filters show correct French labels in NotificationsPage
