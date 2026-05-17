# Task 07 — Project UI Fixes

**Priority:** 🟡 Priority 3
**Depends on:** nothing
**Blocks:** nothing

---

## Why This Exists

Two small but important UX gaps in the project views:

1. **Completed projects do not visually grey out**: The spec says "Completed projects should visually change — greyed appearance, archived styling, visual distinction." The backend has `projectStatus: "completed"` but no CSS styling difference is applied to completed project cards.

2. **No deadline extension UI**: The spec says "if deadline passes: director receives notification, director can manually extend time." The `updateProject()` endpoint exists and can change the deadline, but there is no dedicated UI button for this action in the director's project view.

---

## Sub-Task A — Completed Project Greying

### Where to Apply

Every page that renders project cards:
- `frontend/src/pages/dashboard/agency/DirectorProjects.js`
- `frontend/src/pages/dashboard/ClientDashboard.js` (projects section)
- `frontend/src/pages/dashboard/freelancer/FreelancerProjects.js`
- `frontend/src/pages/dashboard/TeamDashboard.js` (projects section)
- Any shared project card component

### What to Change

For each project card, when `project.projectStatus === "completed"` or `project.projectStatus === "cancelled"`:

**Visual changes to apply:**
- Card background: muted grey (`#1a1a1a` or `rgba(255,255,255,0.03)` on dark theme)
- Card border: grey (`#444` instead of accent color)
- Progress bar: grey fill instead of colored fill
- Status badge: grey pill with "Terminé" or "Annulé" text
- All text: reduced opacity (`opacity: 0.6`)
- Add a thin "ARCHIVÉ" or "TERMINÉ" watermark label in top-right corner of the card
- Remove action buttons (assign, add task) — only "Voir" (view) remains

**Do NOT hide or remove completed projects** — they stay visible in the list but are visually distinct.

### Implementation

If project cards are rendered inline in each page, extract a shared component:

**New Component: `frontend/src/components/projects/ProjectCard.jsx`**

Props:
- `project` — full project object
- `onView` — callback
- `onExtendDeadline` — callback (director only, shown only on overdue/expired deadline)
- `isDirector` — boolean to show admin actions

Apply greying via conditional MUI `sx` prop based on `project.projectStatus`.

---

## Sub-Task B — Deadline Extension UI

### Where to Apply

In the director's project list and detail view:
- `frontend/src/pages/dashboard/agency/DirectorProjects.js`

### What to Add

**Condition to show extension button:**
Show "Prolonger l'échéance" button when:
- `project.projectStatus !== "completed"` AND `project.projectStatus !== "cancelled"`
- AND `new Date(project.deadline) < new Date()` (deadline has passed)

**UI:**
- Small "Prolonger l'échéance" button (outlined, warning color amber) on the project card or in the project detail header
- Clicking opens a small modal / inline date picker:
  - Label: "Nouvelle date d'échéance"
  - Date picker (must be after today)
  - Optional note: "Raison de la prolongation" (textarea, optional)
  - Confirm button

**Backend call on confirm:**
```js
projectService.updateProject(project._id, {
  deadline: newDate,
  statusHistory: [..., { status: project.projectStatus, changedAt: now, changedBy: directorId, note: reason }]
})
```

Use the existing `PATCH /projects/:projectId` endpoint — no new backend needed.

**After success:**
- Refresh project list
- Show success snackbar: "Échéance prolongée au [new date]"

### New Component: `frontend/src/components/projects/ExtendDeadlineModal.jsx`

Props:
- `open` — boolean
- `currentDeadline` — Date
- `onConfirm(newDate, reason)` — callback
- `onClose` — callback

---

## Files to Create

```
frontend/src/components/projects/ProjectCard.jsx          NEW (shared card component)
frontend/src/components/projects/ExtendDeadlineModal.jsx  NEW
```

## Files to Modify

```
frontend/src/pages/dashboard/agency/DirectorProjects.js
    - Use ProjectCard component
    - Pass isDirector=true
    - Wire onExtendDeadline to open ExtendDeadlineModal

frontend/src/pages/dashboard/ClientDashboard.js
    - Use ProjectCard component for project list

frontend/src/pages/dashboard/freelancer/FreelancerProjects.js
    - Use ProjectCard component

frontend/src/pages/dashboard/TeamDashboard.js
    - Use ProjectCard component
```

---

## Acceptance Criteria

- [ ] Completed and cancelled project cards have greyed background + reduced opacity
- [ ] Completed projects show "TERMINÉ" label in card corner
- [ ] Cancelled projects show "ANNULÉ" label
- [ ] Active projects are NOT greyed
- [ ] "Prolonger l'échéance" button appears only when deadline has passed and project is still active
- [ ] Clicking the button opens a date picker modal
- [ ] Submitting a new date calls updateProject and refreshes the list
- [ ] A success message confirms the extension
