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

- [x] **Add soft-delete to all controllers**
  - Never use `.deleteOne()` or `.findByIdAndDelete()` on users, pitches, projects, tasks, contracts
  - Instead: set `accountStatus: "archived"` or `status: "closed"/"cancelled"`
  - For posts: already handled via `close` endpoint
  - For pitches: already `withdrawn`/`rejected` — no delete route exists
  - For projects: `status: "cancelled"` path, never delete
  - Middleware guard added in `server.js`: rejects DELETE on pitches, projects,
    contracts, agency-members, team-members with HTTP 405

- [x] **Add handover logic when replacing a worker on a task**
  - File: `backend/controllers/projectController.js`
  - `updateTask` now tracks removed assignees into `previousAssignees` array
  - `previousAssignees: [{ memberId, memberName, memberType, removedAt }]`
  - Added to task schema in `backend/models/Project.js`

- [x] **Add collaboration history to Freelancer**
  - File: `backend/models/Freelancer.js`
  - Added `endDate`, `endReason`, `endedBy` to `agencyCollaborations` entries
  - `detachFreelancer` controller now sets these fields on termination

- [x] **Add account restoration endpoint**
  - `PATCH /agency-members/:id/restore` → sets accountStatus: "active"
  - `PATCH /team-members/:id/restore` → sets isActive: true
  - Also added `GET /agency-members/:id/history` for member project/task history

---

## Frontend Tasks

- [x] **Show full worker history in director member detail view**
  - File: `DirectorMembers.js`
  - "Historique" button on every member row
  - Modal shows: projects participated in, tasks assigned (current + previous),
    completed task count, handover dates
  - Read-only

- [x] **Show previous assignees on tasks (read-only)**
  - File: `DirectorProjects.js`
  - If `task.previousAssignees` is not empty: shows "Précédemment : Name" below
    current assignee in the task row

- [x] **Archived members section in director members page**
  - File: `DirectorMembers.js`
  - Already existed: collapsible "Anciens membres" section with Restaurer button
  - Updated to use dedicated `PATCH /:id/restore` endpoint via `agencyMemberService.restoreMember`

- [x] **Show collaboration history on freelancer profile**
  - File: `ProfilePage.js`
  - Timeline section: each agency collaboration with dates, role, and status badge
  - Active collaborations highlighted; ended ones shown in grey with optional end reason
  - profileController populates `agencyCollaborations.agency` to include agencyName
