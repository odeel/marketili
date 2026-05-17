# PROJECT_STATUS.md — Marketili Full Audit

> Generated: 2026-05-17
> Branch: yacine-fixes
> Based on: `Marketili — Complete Project Knowle.md` vs actual codebase

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented (backend + frontend) |
| 🟡 | Partially implemented (some gaps) |
| ❌ | Not implemented |
| 🔵 | Backend only (no UI yet) |
| 🟠 | Frontend only (no backend wired) |

---

## 1. Authentication & Registration

| Requirement | Status | Notes |
|---|---|---|
| Multi-role registration (Client, Agency, Team, Freelancer) | ✅ | All 4 roles fully wired |
| Auto-detection login (tries all 7 models) | ✅ | authController.login() |
| Client: Person mode / Company mode | ✅ | accountType enum, displayName virtual |
| Agency: Main / Filiale (subsidiary) | ✅ | agencyType + parentAgency ref |
| Agency specialties during registration | ✅ | specialties[] on Agency model; Register.js step 3 |
| Freelancer: numéro carte auto-entrepreneur | ✅ | carteAutoEntrepreneur field |
| JWT HTTP-only cookies | ✅ | Set on login, cleared on logout |
| Role-based authorization middleware | ✅ | protect + authorize() + adminOnly |
| Agency member: forced password change on first login | ✅ | mustChangePassword flag + ChangePasswordPage; also wired for team_member role |
| PrivateRoute system | ✅ | allowedRoles checked per route |
| Unauthorized access page | ✅ | /unauthorized route |
| isActive check on login | ✅ | auth middleware validates |
| Go-back navigation on unauthorized | ✅ | Unauthorized.js has conditional redirect |
| Admin registration | 🔵 | Admin model exists; no self-registration UI (admin-only panel) |

---

## 2. Posts

| Requirement | Status | Notes |
|---|---|---|
| Title | ✅ | |
| Status (open / in_progress / closed / reactivated) | ✅ | |
| Description | ✅ | |
| Objectives | ✅ | Dedicated `objectives` field on Post model; textarea in CreatePostModal; displayed in PostCard (purple italic block) |
| Budget range (min / max) | ✅ | budget.{min, max, currency} |
| Benefits / non-monetary compensation | ✅ | compensationType + benefits field |
| Optional / flexible pricing | ✅ | compensationType: monetary \| benefits \| mixed |
| Deadline | ✅ | |
| Region (location) | ✅ | location.{city, region, country} |
| Required skills | ✅ | requiredSkills[] |
| Media uploads | ✅ | media[] via GridFS |
| Marketing type | ✅ | marketingType enum: Events, 360, ATL, BTL, Production, Brand |
| Collaboration type | ✅ | collaborationType: service \| partnership \| sponsorship \| exposure |
| Public or targeted to specific provider | ✅ | isPublic + sentTo[] + sendPostToProvider endpoint |
| Provider can send pitch directly to client | ✅ | initiatedBy field on Post; ProfilePage "Envoyer une proposition" modal for provider viewing client profile; ClientDashboard shows amber "Proposition reçue" badge |
| Post filters: status, location, category, type | ✅ | postController.getPosts() |
| Post search (title + description) | ✅ | |
| Pagination | ✅ | |
| Sort by deadline / pitchCount / createdAt | ✅ | |
| Close post (auto-rejects pending pitches) | ✅ | |
| Reactivate post | ✅ | |
| Delete post (only if no pitches) | ✅ | |
| min ≤ max budget validation | ✅ | Backend enforced |
| Post creation UI (CreatePostModal) | ✅ | |
| Client browses other posts + providers | ✅ | ClientBrowse page |

---

## 3. Pitches

| Requirement | Status | Notes |
|---|---|---|
| Status flow: pending → accepted \| rejected \| withdrawn | ✅ | |
| Auto-reject other pitches when one accepted | ✅ | acceptPitch() |
| Auto-create project on acceptance | ✅ | Project auto-created in acceptPitch() |
| Post moves to in_progress on acceptance | ✅ | |
| Notifications on accept/reject | ✅ | |
| **Agency → Client pitch** (structured, 5-step) | 🟡 | Backend fields complete; frontend PitchForm has general fields but the full 5-step Agency→Client version (strategy, content pillars, competitive analysis, etc.) is the "version 2" form — verify it is correctly routed in production |
| Agency → Client: strategy, objectives, techniques | ✅ | strategy{} on Pitch model |
| Agency → Client: content pillars, publication calendar | ✅ | content{} on Pitch model |
| Agency → Client: competitive analysis, color palette, positioning | ✅ | analysis{} on Pitch model |
| Agency → Client: target audience (age, gender, niche, location) | ✅ | targetAudience{} on Pitch model |
| Agency → Client: contract article sections (PRÉAMBULE … ARTICLE 15) | 🟡 | Fields exist for contract content; no form UI that maps to each article |
| **Freelancer → Client pitch** (flexible) | ✅ | pitchType: freelancer_to_client; simpler fields |
| **Team → Client pitch** | ✅ | pitchType: team_to_client |
| **Agency → Freelancer pitch** (CONVENTION DE COLLABORATION) | 🟡 | pitchType: agency_to_freelancer exists; CONVENTION articles not mapped to individual form fields |
| Internal agency approval workflow | ✅ | internalStatus: draft → with_chef_de_projet → approved → sent |
| Role-based internal transitions (strategist, chef_de_projet, director) | ✅ | updateInternalStatus() enforces job title |
| Pitch with file attachments | ✅ | attachments[] via GridFS |
| Client can reject with reason | ✅ | rejectPitch() + rejectionReason |
| Sender can withdraw | ✅ | |
| isReadByRecipient flag | ✅ | |

---

## 4. Projects

| Requirement | Status | Notes |
|---|---|---|
| Auto-created after pitch acceptance | ✅ | |
| ONE shared project (client + provider both reference it) | ✅ | |
| Viewed differently by role | ✅ | getClientProjects vs getAgencyProjects etc. |
| Project card: progress, client, deadline, status, workers, stats | ✅ | |
| Project detail: progress bars, tasks, client info, workers, deadlines, deliverables | ✅ | |
| Completed projects turn grey visually | ✅ | Diagonal watermark ribbon (completed/cancelled) on project cards in agency, team member, and freelancer dashboards |
| Ordered by closest deadline first | ✅ | |
| Deadline color system (grey/green/yellow/orange/red) | ✅ | deadlineColor.js utility |
| Progress auto-calculated (done tasks / total) | ✅ | |
| Status: pending / active / in_review / completed / cancelled | ✅ | |
| statusHistory tracking | ✅ | |
| Deliverables submission | ✅ | addDeliverable endpoint + model |
| assignedMembers tracking | ✅ | |
| Deadline extension by director | 🔵 | updateProject() changes deadline; no dedicated "extend deadline" button in UI |
| Closest deadline filtering | ✅ | |
| Calendar integration | ✅ | calendarController returns project deadlines |

---

## 5. Tasks

| Requirement | Status | Notes |
|---|---|---|
| Tasks embedded inside projects | ✅ | tasks[] subdocument on Project |
| Director assigns tasks to members / freelancers / self | ✅ | createTask endpoint |
| Status: todo → in_progress → in_review → done | ✅ | (spec says "pending → in_progress → review → done"; backend uses "todo" instead of "pending" — functionally equivalent) |
| Task reassignment | ✅ | previousAssignees[] handover trail |
| Priority levels (low / medium / high / urgent) | ✅ | |
| Due date per task | ✅ | |
| Deadline color system | ✅ | |
| Ordered by closest deadline first | 🟡 | Backend: ordering not enforced server-side; frontend must sort locally |
| Task deliverables (file submission) | ✅ | deliverables[] per task |
| Task comments | ✅ | comments[] per task |
| Member can work on multiple projects simultaneously | ✅ | assignedProjects[] on AgencyMember |
| Workers can receive tasks outside primary role | ✅ | No hard restriction on assignment |
| AgencyMember: getMemberTasks | ✅ | |

---

## 6. Contracts

| Requirement | Status | Notes |
|---|---|---|
| Client ↔ Agency | ✅ | partyAType / partyBType support all combos |
| Client ↔ Freelancer | ✅ | |
| Agency ↔ Freelancer | ✅ | |
| Team ↔ Freelancer | ✅ | |
| Agency ↔ AgencyMember | ✅ | |
| Contract types: service agreement, collaboration, CDD, CDI | ✅ | contractType enum |
| Contract flow inside chat system | ❌ | No chat/conversation system exists. Contract has `conversationId` ref on Project but no Conversation/Message models or routes |
| Contrat Proforma form (agency fills) | 🟡 | Fields exist on Contract model; dedicated Proforma form UI not confirmed |
| Auto-generate PDF from form | ❌ | contractPdf field exists to store PDF; no PDF generation library integrated |
| PDF sent through chat | ❌ | No chat system |
| Client notified to upload receipt | ✅ | Notification trigger exists |
| Client uploads receipt | ✅ | uploadReceipt endpoint + UI in ClientDashboard |
| Agency sends Bon de Commande | ✅ | sendBonDeCommande endpoint |
| Success message in chat + notification | 🟡 | Notification triggers exist; no chat |
| Contract encryption | ❌ | Deferred; noted in spec as future |
| No digital signature | ✅ | Correct — not implemented |
| Contract status filters (client, date, done, résiliation, not completed) | ✅ | getContracts() supports these filters |
| Resiliate contract | ✅ | |
| Director / commercial / main account see contracts page | ✅ | DirectorContracts page with inline search |

---

## 7. Collaborations & Worker Lifecycle

| Requirement | Status | Notes |
|---|---|---|
| Employment-style collaboration | ✅ | agencyCollaborations[] on Freelancer |
| Partnership agreement | ✅ | contractType supports it |
| Worker leaves → account status: inactive / suspended / archived (NOT deleted) | ✅ | accountStatus enum on AgencyMember |
| Previous work remains historically attached | ✅ | Soft-delete protection on all core entities in server.js |
| Old tasks linked to original executor | ✅ | previousAssignees[] preserved |
| Replacement worker inherits current tasks only (read-only for history) | 🟡 | Handover is tracked; read-only enforcement on old history is a UI concern, not enforced at API level |
| Restoration system (account reactivated for future collaboration) | ✅ | setMemberStatus to active |
| Freelancer collaborates with multiple agencies | ✅ | agencyCollaborations[]; context switching in UI |
| Freelancer context card switching (Agency A / Agency B / Team C) | ✅ | FreelancerCollaborations + ContextBar |
| Isolated workspaces per collaboration context | ✅ | FreelancerProjects filters by agencyId |
| Freelancer can send application to teams/agencies | ✅ | CollaborationRequest model + apply/respond endpoints; DirectorMembers "Demandes reçues" tab; FreelancerCollaborations "Mes demandes" tab |

---

## 8. Profiles

| Requirement | Status | Notes |
|---|---|---|
| Client profile: field of work, activity, previous collaborations | 🟡 | bio exists; no dedicated "field of work" field; previous collaborations via projects |
| Agency profile: previous collaborations, services, portfolio, workers | ✅ | |
| Freelancer profile: skills, collaborations, portfolio | ✅ | |
| Team profile: members, specialization, campaigns | 🟡 | members + specialties exist; "campaigns" = portfolio items |
| All profiles: bio, specialties, stats, publications, work showcase, media, projects, achievements | ✅ | achievements[] field on Client model; tags input in EditProfilePage; pill display on ProfilePage |
| Social-style posts (update, achievement, campaign, announcement) | ✅ | ProfilePost model + routes + UI |
| Portfolio items | ✅ | portfolioItems[] on Agency, Team, Freelancer |
| Collaboration history on profile | ✅ | agencyCollaborations[] shown on FreelancerProfile |
| Public profile view (any role viewable by anyone) | ✅ | GET /profile/:role/:id — no auth required |
| Profile edit | ✅ | EditProfilePage + PATCH /profile/me |
| Social links (Instagram, TikTok, YouTube, LinkedIn, Twitter) | ✅ | Freelancer model only |
| Browse providers (search, filter by type/specialty/region) | ✅ | BrowseProvidersPage |
| Specialties appear before bio, editable later | ✅ | |
| Completed projects count on profile | ✅ | profileController.getProfile() aggregates it |

---

## 9. Notifications

| Requirement | Status | Notes |
|---|---|---|
| 19+ event types | ✅ | |
| Categories: tasks, projects, contracts, pitches, deadlines, admin, messages | ✅ | |
| Urgency colors | ✅ | |
| Filter by category | ✅ | |
| isRead flag | ✅ | |
| Mark all read | ✅ | |
| Unread count badge | ✅ | Polled every 30s in DashboardLayout |
| Only director sees contract + project notifications | 🟡 | No server-side role filter on notification delivery — all notifications sent to recipient; UI filtering not confirmed |
| Notification bell in topbar dropdown | ✅ | DashboardLayout topbar |
| Full notifications page | ✅ | NotificationsPage |
| Pagination | ✅ | |
| Notification on: pitch received, accepted, rejected | ✅ | |
| Notification on: project created | ✅ | |
| Notification on: task overdue | ✅ | type: "task_overdue" |
| Notification on: contract milestones | ✅ | contract_sent, contract_acknowledged, contract_signed types |
| Notification on: collaboration request | ✅ | Fired when freelancer sends apply request and when agency/team responds |
| Notification on: account restored | ✅ | logActivity call in setMemberStatus when restoring to active; notification trigger present |
| Notification on: director approval needed | ✅ | pitch internal workflow triggers |

---

## 10. Dashboards

| Requirement | Status | Notes |
|---|---|---|
| Calendar (all users) | ✅ | |
| Personal notes + reminders + pinned tasks | ✅ | PersonalNote model + noteController + PersonalNotes UI |
| Activity planning (appears in calendar automatically) | ✅ | SharedCalendar pulls personal reminder notes as purple events with 🔔 icon; "Marquer comme fait" button marks them done with strikethrough |
| **Client:** my posts + create post | ✅ | |
| **Client:** browse providers + browse posts | ✅ | |
| **Client:** pitches received | ✅ | |
| **Client:** projects | ✅ | |
| **Client:** contracts | ✅ | |
| **Client:** calendar | ✅ | |
| **Client:** profile | ✅ | |
| **Agency Director:** flagged posts | ✅ | |
| **Agency Director:** pitches | ✅ | |
| **Agency Director:** projects | ✅ | Search by title/client name; status filter tabs |
| **Agency Director:** contracts | ✅ | Inline search by party/project/type |
| **Agency Director:** members management | ✅ | Includes incoming collaboration requests tab |
| **Agency Director:** analytics | ✅ | DirectorAnalytics page: pitch win rate, revenue line chart, project status donut, member workload bar chart (Recharts) |
| **Agency Director:** calendar | ✅ | |
| **Agency Commercial:** browse + flag posts | ✅ | CommercialBrowse page |
| **Agency Worker:** tasks, projects, calendar | ✅ | WorkerTasks, WorkerProjects, WorkerCalendar |
| **Freelancer:** browse posts | ✅ | |
| **Freelancer:** pitches | ✅ | |
| **Freelancer:** collaborations (context switching) | ✅ | Includes "Mes demandes" tab for outgoing apply requests |
| **Freelancer:** projects | ✅ | |
| **Freelancer:** profile | ✅ | |
| **Team:** overview, pitches, projects, members | ✅ | TeamDashboard |
| **Team Member:** tasks, projects, calendar | ✅ | Projects page (TeamMemberProjects), Personal Notes, Notifications all added; mustChangePassword flow wired |

---

## 11. Agency Internal Workflow

| Requirement | Status | Notes |
|---|---|---|
| Commercial: browse and flag posts | ✅ | flagPost endpoint + CommercialBrowse UI |
| Director: review flagged posts, select, forward to strategist | ✅ | DirectorFlaggedPosts + internalStatus |
| Strategist: prepare pitch, send to chef de projet | ✅ | internalStatus: draft → with_chef_de_projet |
| Chef de projet: validate, send to client; if rejected → back to strategist | ✅ | internalStatus: approved → sent or back |
| Job titles: director, commercial, strategist, chef_de_projet, designer, editor, smm, community_manager | ✅ | AgencyMember.jobTitle enum |
| Multiple workers with same job on same project | ✅ | No restriction; assignedMembers[] allows multiple |
| Member in multiple projects | ✅ | |
| Task assignment by director | ✅ | |

---

## 12. Admin System

| Requirement | Status | Notes |
|---|---|---|
| Manage users (list, search, filter by role) | ✅ | getAllUsers() |
| Disable / enable accounts | ✅ | toggleUserStatus() |
| Access statistics | ✅ | getStats() — users, posts, pitches counts |
| Add fields and options (dropdown configurator) | ✅ | OptionsList model + admin options routes |
| Add ads | ✅ | Ad model + adController + adRoutes; AdBanner component served to dashboards by role/placement; admin "Publicités" tab with create/toggle/delete |
| Monitor posts | ✅ | getAdminPosts() + removePost() |
| Monitor platform activity | ✅ | ActivityLog model + getActivityLog() endpoint; "Journal" tab in AdminDashboard with emoji icons per actionType, actionType filter, pagination |
| AdminDashboard (DashboardLayout-based) | ✅ | AdminDashboard.jsx |
| AdminPanel (standalone, self-contained auth) | ✅ | AdminPanel.jsx (not currently routed in App.js) |

---

## 13. History & Timestamps

| Requirement | Status | Notes |
|---|---|---|
| Post creation timestamp | ✅ | createdAt via Mongoose timestamps |
| Pitch sent timestamp | ✅ | |
| Task assigned timestamp | ✅ | assignedAt in assignedMembers |
| Project started timestamp | ✅ | startDate field |
| Completion date | ✅ | completedAt field |
| Edit tracking | 🟡 | No generic edit log; statusHistory exists on Project/Contract; ActivityLog records key action types |
| Pitch validation / denial timestamps | ✅ | respondedAt field |
| Never hard-delete (all soft) | ✅ | server.js 405 protection on delete for core entities |
| Deadline extension by director | 🔵 | No UI; updateProject can change deadline |

---

## 14. Global UX Requirements

| Requirement | Status | Notes |
|---|---|---|
| Search everywhere | 🟡 | Posts, providers, pitches, contracts (DirectorContracts), projects (DirectorProjects) all have search; not in all subpages |
| Status filters | ✅ | Posts, pitches, projects, contracts all filterable |
| Date filters | ✅ | Contracts, posts support date range |
| Region filters | ✅ | Posts, providers |
| Sorting | ✅ | Posts support sort param |
| Closest deadline first ordering | 🟡 | Implemented in calendar + posts; not enforced everywhere |
| Colored urgency system | ✅ | deadlineColor.js used across dashboards |
| Structured inputs (dropdowns, radio, checkbox) | ✅ | Forms use MUI Select/Radio/Checkbox throughout |
| No meeting terminology | ✅ | None present in codebase |
| No localStorage | ✅ | All state via cookies + hooks |
| No Redux / Zustand / Context | ✅ | Custom hooks only |
| French UI labels, English internal naming | ✅ | |
| Premium SaaS design (black/red gradients, smooth animations) | ✅ | Framer Motion, consistent dark palette |
| No emojis in dashboards | ✅ | |
| Calendar integration for deadlines + tasks | ✅ | calendarController + calendar pages |

---

## 15. Tech Stack & Libraries

| Requirement | Status | Notes |
|---|---|---|
| React CRA | ✅ | |
| Express.js | ✅ | |
| MongoDB Atlas + Mongoose ^8.x | ✅ | |
| JWT HTTP-only cookies | ✅ | |
| GridFS file storage (images, video, PDF, 50MB) | ✅ | |
| axios locked at 0.27.2 | ✅ | |
| Framer Motion | ✅ | |
| MUI v7.3 | ✅ | |
| bcryptjs | ✅ | |
| multer + multer-gridfs-storage | ✅ | |
| Recharts | ✅ | Used in DirectorAnalytics (LineChart, BarChart, PieChart) |
| Separate collections per role | ✅ | |

---

## Summary: What Is Done vs What Is Missing

### ✅ Fully Working

- Complete multi-role auth (7 roles, JWT cookies, force-password-change for agency_member and team_member)
- Post lifecycle (create, browse, filter, close, reactivate, delete, targeted sending, objectives field, provider→client direct proposal)
- Pitch lifecycle (submit, internal approval workflow, accept/reject/withdraw, auto-project creation)
- Project management (auto-create, tasks, deliverables, comments, assignment, deadline colors, progress, completed project diagonal ribbon)
- Contract lifecycle (draft → sent → receipt → bon de commande → signed → résiliation), with filters and inline search
- Agency internal workflow (commercial flags → director selects → strategist pitches → chef validates)
- Freelancer multi-agency context switching with isolated workspaces
- Worker lifecycle (soft statuses: inactive/suspended/archived, restoration, historical integrity)
- Freelancer apply-to-join workflow (CollaborationRequest: apply, respond accept/decline, notifications both sides)
- All 4 main dashboards (Client, Agency, Freelancer, Team) with role-split views
- Agency Director analytics (pitch win rate, revenue trend, project status donut, member workload — Recharts)
- TeamMember dashboard (projects, personal notes, notifications, force-password-change)
- Personal notes with pin/reminder; reminders auto-appear in calendar as purple events with mark-done action
- Notification system (19+ types, categories, unread count, mark-all-read, collaboration request triggers, account restored trigger)
- Profiles (public view, edit, portfolio, social posts, collaboration history, client achievements field)
- Browse providers with search/filter
- Calendar with color-coded deadlines and personal reminders
- Admin system (users, stats, options configurator, post moderation, ads management, activity log journal)
- Ads system (Ad model, role/placement targeting, dismissible AdBanner in dashboards, admin CRUD)
- Activity log (ActivityLog model, 14 action types auto-logged across controllers, paginated journal in admin)
- Landing page (full French content, animations, contact section)
- GridFS uploads (images, video, PDF)

---

### ❌ Not Implemented

| Missing Feature | Where Needed |
|---|---|
| **Chat / Conversation system** | Contract flow requires PDF exchange through chat; no Conversation or Message model, no chat routes, no chat UI |
| **PDF auto-generation** (Contrat Proforma → PDF) | contractController and frontend; `contractPdf` field exists but no generator (e.g., pdfkit, puppeteer) integrated |
| **Agency → Freelancer pitch: CONVENTION articles mapped to form** | PitchForm for agency_to_freelancer exists but individual CONVENTION DE COLLABORATION articles (01–11) are not mapped to distinct form fields |
| **Contract Proforma form UI** | Dedicated multi-article contract form (PRÉAMBULE → ARTICLE 15) not built |

---

### 🟡 Partially Implemented (Gaps to Close)

| Partial Feature | What's Done | What's Missing |
|---|---|---|
| **Agency → Client 5-step pitch form** | Backend fields complete; "version 2" form exists | Verify correct PitchForm version is routed; ensure all strategy/content/analysis sections render |
| **Notification director-only filter** | All notification types exist | No server-side filter ensuring only director receives contract/project notifications |
| **Deadline extension UI** | updateProject() can change deadline | No dedicated "extend deadline" button in director's project view |
| **Search uniformity** | Posts, pitches, contracts, projects, providers have search | Not present in all sub-panels (e.g. task list, notification list) |
| **Client profile field of work** | bio + achievements cover context | No dedicated structured "field of work" or "industry" display on public profile |
