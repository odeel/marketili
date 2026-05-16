# Task 14 — Collaboration & Worker Lifecycle

## What's Already Done
- ObjectId references (not deleted) preserve historical integrity
- isActive toggle on AgencyMember, TeamMember
- Freelancer.agencyCollaborations array exists on model

---

## Goals
- Account statuses: active / inactive / suspended / archived (not just a boolean)
- Soft-delete pattern everywhere — nothing is ever hard-deleted
- Historical data permanently attached even after a worker leaves
- Replacement worker inherits ongoing tasks only (not history)
- Account restoration for seasonal/recurring collaborators
- Freelancer multi-agency collaboration fully manageable

---

## Backend Tasks
*(Most of this builds on task 07 which introduces accountStatus)*

- [ ] **Add soft-delete to all controllers**
  - Never use `.deleteOne()` or `.findByIdAndDelete()` on users, pitches, projects, tasks, contracts
  - Instead: set `accountStatus: "archived"` or `status: "closed"/"cancelled"`
  - For posts: already handled via `close` endpoint
  - For pitches: already `withdrawn`/`rejected` — confirm no delete route exists
  - For projects: add `status: "cancelled"` path, never delete
  - Add a middleware check: reject DELETE requests on sensitive models and return 405

- [ ] **Add handover logic when replacing a worker on a task**
  - File: `backend/controllers/projectController.js`
  - When `updateTask` changes `assignedTo`:
    - Keep the original `assignedTo` in a new field: `previousAssignees: [{ memberId, memberName, handoverDate }]`
    - New assignee can only see task from handover date forward (enforced on frontend)
    - Historical task data stays linked to original assignee

- [ ] **Add collaboration history to Freelancer**
  - File: `backend/models/Freelancer.js`
  - `agencyCollaborations` array already exists — add: `endDate`, `endReason`, `endedBy`
  - When detaching freelancer (task 07): set `status: "ended"`, `endDate: now`, `endReason`
  - When restoring: push a NEW entry with `status: "active"` (keep history)

- [ ] **Add account restoration endpoint**
  - File: `backend/routes/agencyMemberRoutes.js`
  - `PATCH /agency-members/:id/restore` — sets `accountStatus: "active"` + logs restoration date
  - Same for team members: `PATCH /team-members/:id/restore`
  - Only director/lead can restore

---

## Frontend Tasks

- [ ] **Show full worker history in director member detail view**
  - File: `DirectorMembers.js` or a member detail modal
  - "Historique" tab on member card:
    - Projects they participated in (even completed)
    - Tasks they completed
    - Collaborations (if freelancer)
  - Read-only — no modifications to historical data

- [ ] **Show previous assignees on tasks (read-only)**
  - File: task detail view or task row
  - If `task.previousAssignees` is not empty: show "(Précédemment: Name)" below current assignee
  - This gives visibility into handover history

- [ ] **Archived members section in director members page**
  - File: `DirectorMembers.js`
  - Separate collapsible section: "Anciens membres"
  - Shows archived/ended members with their last role and end date
  - "Restaurer" button → calls restore endpoint

- [ ] **Show collaboration history on freelancer profile**
  - File: `ProfilePage.js` (from task 09)
  - Timeline section: each agency collaboration with dates, role, and status badge
  - Current collaborations highlighted; ended ones shown in grey
