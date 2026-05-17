# Task 09 — TeamMember Dashboard Completeness

**Priority:** 🟡 Priority 3
**Depends on:** nothing
**Blocks:** nothing

---

## Why This Exists

`TeamMember` has a complete model (`team`, `firstName`, `lastName`, `jobTitle`, `skills`, `assignedProjects`, `assignedTasks`, `mustChangePassword`) and the auth middleware maps `team_member` role correctly. However, the team_member dashboard (inside `TeamDashboard.js`) is sparse compared to what agency workers get, and some subpages may be missing or incomplete.

The spec says team members should have at minimum: tasks, projects, calendar.

---

## What Needs to Be Verified and Built

### 1. Verify TeamDashboard role split

In `frontend/src/pages/dashboard/TeamDashboard.js`:

Check that `team_member` role gets a separate view from `team` (team lead). The pattern should mirror `AgencyDashboard` where:
- `team` → team lead view (pitches, projects, members, overview)
- `team_member` → worker view (tasks, projects, calendar only)

If `team_member` is being shown the same nav as `team` lead, fix the role split.

### 2. TeamMember Overview page

File: `frontend/src/pages/dashboard/team/TeamMemberOverview.js` (create if missing)

Displays:
- Greeting: "Bonjour [firstName]"
- KPI cards:
  - Tâches en cours (tasks with status in_progress)
  - Tâches à faire (tasks with status todo)
  - Projets assignés (count)
  - Tâches en retard (dueDate passed, not done)
- My tasks list (5 most urgent — sorted by dueDate asc)
- My projects list (3 most recent)

Data source: `projectService.getMemberTasks(memberId)` + `projectService.getMemberProjects(memberId)`

### 3. TeamMember Tasks page

File: `frontend/src/pages/dashboard/team/TeamMemberTasks.js` (create if missing, similar to WorkerTasks for agency)

Displays:
- All tasks assigned to this team member, across all projects
- Grouped by project (project name as section header)
- Each task card shows: title, status, priority, dueDate, deadline color
- Status update: team member can move their own task from `todo` → `in_progress` → `in_review`
- File upload on task: submit deliverable (POST `/projects/:projectId/tasks/:taskId/deliverables`)
- Comment on task (POST `/projects/:projectId/tasks/:taskId/comments`)

### 4. TeamMember Projects page

File: `frontend/src/pages/dashboard/team/TeamMemberProjects.js` (create if missing)

Displays:
- All projects this team member is assigned to
- Project card: title, client, deadline, status, their own tasks count
- Clicking a project: shows project detail (read-only — progress, tasks, deadline, deliverables)
- Team member can NOT modify project-level info, only their own task statuses

### 5. TeamMember Calendar

File: `frontend/src/pages/dashboard/team/TeamMemberCalendar.js`

Uses the shared calendar component. Role: `team_member`, userId: `member._id`.
Should already work if `calendarController` handles team_member role — verify the role is in the allowed list.

### 6. Backend: verify getMemberTasks and getMemberProjects work for team_member

In `backend/controllers/projectController.js`:

- `getMemberTasks(memberId)`: should return tasks where `task.assignedTo[].memberId === memberId` from all projects — verify `memberType: "TeamMember"` is handled
- `getMemberProjects(memberId)`: should return projects where `assignedMembers[].memberId === memberId` — verify TeamMember is included

Check `backend/routes/projectRoutes.js`:
- Confirm routes `/projects/member/:memberId/tasks` and `/projects/member/:memberId/projects` are mounted

### 7. TeamMember first-login password change

`mustChangePassword` is on the TeamMember model. Verify that:
- The auth middleware (`protect`) checks `mustChangePassword` for `team_member` role
- If true, redirects to `/change-password`
- `ChangePasswordPage` calls the correct service for team_member

Currently `ChangePasswordPage` calls `agencyMemberService.changePassword()`. This may need a `teamMemberService.changePassword()` method and a corresponding endpoint:

Backend: add `POST /api/team-members/change-password` in `teamMemberController.js` (if not already there).

---

## Files to Create

```
frontend/src/pages/dashboard/team/TeamMemberOverview.js   (if missing)
frontend/src/pages/dashboard/team/TeamMemberTasks.js      (if missing)
frontend/src/pages/dashboard/team/TeamMemberProjects.js   (if missing)
frontend/src/pages/dashboard/team/TeamMemberCalendar.js   (if missing)
```

## Files to Modify

```
frontend/src/pages/dashboard/TeamDashboard.js
    - Ensure team_member role gets its own nav (Tasks, Projects, Calendar, Notes, Notifications)
    - Route team_member to TeamMemberOverview/Tasks/Projects/Calendar

frontend/src/pages/auth/ChangePasswordPage.js
    - Handle team_member role (call teamMemberService.changePassword instead of agencyMemberService)

frontend/src/services/teamMemberService.js
    - ADD changePassword() method

backend/controllers/teamMemberController.js
    - ADD changePassword() endpoint (if not present)
    - VERIFY first-login flow clears mustChangePassword

backend/routes/teamMemberRoutes.js
    - ADD POST /change-password route (if not present)

backend/controllers/projectController.js
    - VERIFY getMemberTasks handles memberType: "TeamMember"
    - VERIFY getMemberProjects handles TeamMember assignments
```

---

## Acceptance Criteria

- [ ] `team_member` role sees: Overview, Tasks, Projects, Calendar, Notes, Notifications in nav — NOT the team lead nav
- [ ] TeamMember Overview shows real task/project counts from backend
- [ ] Tasks page shows all assigned tasks, grouped by project, with deadline colors
- [ ] Team member can update their own task status from todo → in_progress → in_review
- [ ] Team member can upload a deliverable file on a task
- [ ] Team member can comment on a task
- [ ] Projects page shows assigned projects in read-only mode
- [ ] Calendar shows task due dates and project deadlines for this team member
- [ ] mustChangePassword forces password change on first login for team_member role
