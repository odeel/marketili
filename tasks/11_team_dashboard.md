# Task 11 — Team Dashboard

## What's Already Done
- Route exists in App.js → ComingSoon placeholder
- Team model: teamName, leadFirstName/LastName, specialties, portfolioItems, members
- TeamMember model: team ref, jobTitle, skills, assignedProjects, assignedTasks
- Auth, registration, login all work for team and team_member roles

---

## Goals
- Full team dashboard replacing the ComingSoon page
- Team lead manages members, browses posts, sends pitches, manages projects
- TeamMember sees their assigned tasks and projects (similar to AgencyWorker)
- Team structure is simpler than agency (no commercial/strategist/director split)

---

## Backend Tasks

- [x] **Add team member management endpoints**
  - File: `backend/routes/teamMemberRoutes.js` + `backend/controllers/teamMemberController.js`
  - `POST /team-members/create` — team lead creates a member
  - `GET /team-members` — list members of the requesting team
  - `PATCH /team-members/:id/toggle` — toggle active status
  - `POST /team-members/change-password` — force password change on first login
  - Mount in `server.js`

- [x] **Add GET /projects/team/:teamId endpoint**
  - File: `backend/controllers/projectController.js`
  - Filters by `providerTeam`

- [x] **Add GET /projects/team/:teamId/members endpoint**
  - Returns active team members (for task assignment)

---

## Frontend Tasks

- [x] **Build TeamDashboard layout**
  - File: `frontend/src/pages/dashboard/TeamDashboard.js`
  - Replace ComingSoon in App.js for roles `team` and `team_member`
  - Role detection: `team` (lead) vs `team_member`
  - Lead sidebar: Accueil, Explorer, Mes offres, Projets, Membres, Mon profil
  - Member sidebar: Accueil, Mes tâches, Calendrier, Mon profil

- [x] **Build TeamLeadOverview**
  - Stats: active pitches, active projects, members count
  - Recent pitches + recent projects
  - Quick action: Explorer les posts

- [x] **Build team member management (lead)**
  - Create member form, members list with toggle active
  - Force password change on first login (same logic as AgencyMember)

- [x] **Build TeamBrowse page**
  - Browse public posts
  - "Envoyer une offre" triggers PitchForm with senderType: "Team"

- [x] **Build TeamProjects page**
  - List projects for the team (GET /projects/team/:teamId)
  - Cards with deadline urgency colors
  - Detail view: tasks, assigned members, progress bar

- [x] **Build TeamMemberOverview**
  - My tasks (GET /projects/member/:memberId/tasks)
  - Tasks sorted by closest deadline with urgency colors
  - Calendar view link

- [x] **Build TeamMemberTasks page**
  - Reuses WorkerTasks (same endpoint, same pattern)
  - Status update (in_progress → review → done)
