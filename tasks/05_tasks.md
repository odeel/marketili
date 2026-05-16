# Task 05 — Tasks (inside Projects)

## What's Already Done
- Tasks embedded inside Project documents
- Create task (title, description, assignedTo, dueDate, priority)
- Task status: pending → in_progress → review → done
- Update task status / priority / dueDate
- Progress auto-recalculated when task updated
- Get all tasks for a member across all projects
- Worker tasks page (WorkerTasks.js) with status update
- Task list shown in project detail view

---

## Goals
- Director can create and assign tasks from the project detail view
- Tasks ordered by closest deadline first everywhere
- Deadline urgency colors on task cards/rows (same system as posts/projects)
- Task reassignment (director changes assignedTo on an existing task)
- Worker sees their tasks in context of each project separately
- Tasks can have comments (basic thread per task)

---

## Backend Tasks

- [x] **Add task reassignment support to updateTask**
  - File: `backend/controllers/projectController.js` → `updateTaskStatus`
  - Allow updating `assignedTo` field (not just status/priority/dueDate)
  - Rename the function to `updateTask` to reflect broader scope
  - Update route: `PATCH /projects/:projectId/tasks/:taskId`

- [x] **Add GET /projects/:projectId/tasks endpoint (all tasks in a project)**
  - File: `backend/routes/projectRoutes.js`
  - Returns `project.tasks` array sorted by `dueDate` ascending
  - Used by director to see all tasks without opening each project

- [x] **Add comments array to task sub-schema**
  - File: `backend/models/Project.js` inside the task sub-schema
  - Already present in model — Added `POST /projects/:projectId/tasks/:taskId/comments` endpoint

- [x] **Add server-side dueDate sorting to getMemberTasks**
  - File: `backend/controllers/projectController.js` → `getMemberTasks`
  - Sort tasks by `dueDate: 1` (closest first)

---

## Frontend Tasks

- [x] **Add "Create task" form in director project detail**
  - File: project detail view (director side)
  - Form fields: title, description, assignee (dropdown of project's assignedMembers), dueDate, priority (Low / Medium / High)
  - On submit: call `projectService.createTask(projectId, data)`

- [x] **Add task reassignment in director task view**
  - Next to each task: "Réassigner" button → dropdown of project members
  - On select: call `projectService.updateTask(projectId, taskId, { assignedTo: newMemberId })`

- [x] **Add deadline urgency colors to task rows/cards**
  - Use `getDeadlineColor(task.dueDate)` utility from task 02
  - Apply as colored left border or dot indicator on task rows

- [x] **Sort task lists by closest deadline**
  - In WorkerTasks, director task view, and project detail task list
  - Sort by `dueDate` ascending; tasks with no dueDate go last

- [x] **Add basic comment thread per task**
  - File: task detail view or expandable row
  - Input at bottom: text field + "Envoyer" button
  - Call POST /projects/:projectId/tasks/:taskId/comments
  - Display existing comments with author name, role, date

- [x] **Show task priority badge**
  - File: all task list components
  - Low → grey badge, Medium → yellow badge, High → red badge
