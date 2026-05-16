# Task 04 — Projects

## What's Already Done
- Auto-created on pitch acceptance
- Fields: title, description, deadline, progress, status, assignedMembers, tasks, deliverables, agreedPrice
- Status: pending, active, in_review, completed, cancelled + status history
- Get projects for client and agency (filterable by status)
- Assign member to project endpoint
- Client projects page (cards), agency director projects page, project detail view
- Progress auto-recalculated on task update

---

## Goals
- Project cards ordered by closest deadline first everywhere
- Deadline urgency color system (grey / green / yellow / orange / red)
- Completed projects visually greyed/archived
- Deliverable submission (endpoint + UI)
- Update project deadline (director extends deadline)
- Worker (agency member) sees their projects with full detail
- Client and provider see the SAME project but from their own perspective

---

## Backend Tasks

- [ ] **Add PATCH /projects/:projectId endpoint (update project fields)**
  - File: `backend/routes/projectRoutes.js` + `backend/controllers/projectController.js`
  - Allow updating: `title`, `description`, `deadline`, `projectStatus`, `agreedPrice`
  - Restrict: only agency director or project creator can update
  - Append to `statusHistory` when `projectStatus` changes

- [ ] **Add POST /projects/:projectId/deliverables endpoint**
  - File: `backend/routes/projectRoutes.js` + `backend/controllers/projectController.js`
  - Body: `{ fileUrl, fileName, description, submittedBy, submittedByType }`
  - Push to `project.deliverables` array
  - Set `projectStatus` to `in_review` automatically when first deliverable submitted

- [ ] **Add server-side deadline sorting to project queries**
  - File: `backend/controllers/projectController.js`
  - In `getAgencyProjects` and `getClientProjects`: default sort `deadline: 1`
  - Completed/cancelled projects always last: sort by `projectStatus` then `deadline`

- [ ] **Wire project notifications** (do after task 08_notifications)
  - On project creation: notify client (project started) and agency director
  - On status change to `completed`: notify client
  - On deadline approaching (< 3 days): notify director

---

## Frontend Tasks

- [ ] **Add deadline urgency color to project cards**
  - Use the `getDeadlineColor(deadline)` utility from task 02
  - Apply as a colored left border or badge on each project card
  - Grey out the entire card when `projectStatus === "completed"` or `"cancelled"`

- [ ] **Sort project cards by closest deadline**
  - In client and agency project lists, sort by `deadline` ascending
  - Completed projects moved to end of list

- [ ] **Add deadline extension UI for director**
  - File: `DirectorProjects.js` or project detail view
  - Button "Prolonger le délai" → date picker modal
  - Calls PATCH /projects/:id with new `deadline`

- [ ] **Build deliverable submission UI**
  - File: project detail view (both client-side and agency-side)
  - Agency side: file upload button "Soumettre un livrable" → uploads file, posts to /deliverables
  - Client side: read-only list of submitted deliverables with download links

- [ ] **Build worker's project view**
  - File: `WorkerOverview.js` or a new `WorkerProjects.js`
  - Show projects the worker is assigned to (filter from agency projects by `assignedMembers`)
  - Each project shows: title, deadline, their assigned tasks count, progress bar

- [ ] **Add assign member UI in director project detail**
  - File: project detail view (director)
  - Dropdown of active agency members + role input
  - On submit: call `projectService.assignMember(projectId, data)`

- [ ] **Add project status update UI (director)**
  - Allow director to manually move project status: active → in_review → completed
  - Dropdown or step indicator in the project detail view
