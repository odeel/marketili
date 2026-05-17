# Task 06 — Agency Analytics Dashboard

**Priority:** 🟠 Priority 2
**Depends on:** nothing
**Blocks:** nothing

---

## Why This Exists

The spec includes "analytics" in the Agency dashboard nav. Currently only basic stats (counts) are shown in the DirectorOverview. There is no dedicated analytics page with:
- Pitch win rate
- Project completion rate and velocity
- Revenue tracking
- Member productivity
- Post/opportunity pipeline

---

## Scope

A dedicated analytics page for the agency director. Read-only aggregated data from existing collections — no new models needed.

---

## Backend Work

### 1. New endpoint in `backend/controllers/adminController.js` or new `analyticsController.js`

Prefer a new `backend/controllers/analyticsController.js` to keep concerns separate.

**`getAgencyAnalytics(agencyId)`** — GET `/api/analytics/agency/:agencyId`

Returns the following aggregate data:

**Pitches:**
- Total pitches sent (all time)
- Pitches by status: pending, accepted, rejected, withdrawn
- Win rate: `(accepted / total sent) * 100`
- Pitches sent per month (last 6 months) — for line chart

**Projects:**
- Total projects (all time)
- Projects by status: pending, active, in_review, completed, cancelled
- Completion rate: `(completed / total) * 100`
- Average project duration (completedAt - startDate) in days
- Projects started per month (last 6 months)

**Tasks:**
- Total tasks assigned to agency members
- Tasks by status: todo, in_progress, in_review, done
- Overdue tasks (dueDate < now and status !== done)

**Revenue (if monetary):**
- Total contracted revenue: sum of `project.agreedPrice.amount` for completed projects
- Revenue per month (last 6 months) — if applicable

**Members:**
- Members by jobTitle
- Tasks per member (top 5 most active)

All queries are scoped to `providerAgency: agencyId`.

### 2. New Routes: `backend/routes/analyticsRoutes.js`

```
GET /api/analytics/agency/:agencyId  → getAgencyAnalytics (protect + authorize agency/agency_member director only)
```

### 3. Update `backend/server.js`

Mount: `app.use('/api/analytics', analyticsRoutes)`

---

## Frontend Work

### 1. New Service: `frontend/src/services/analyticsService.js`

```js
getAgencyAnalytics: (agencyId) => api.get(`/analytics/agency/${agencyId}`)
```

### 2. New Page: `frontend/src/pages/dashboard/agency/DirectorAnalytics.js`

Layout:
- Page title: "Analytique"
- Date range picker at top (default: last 6 months)

**Row 1 — KPI Cards (4 cards):**
- Total pitches envoyés
- Taux de conversion (win rate %)
- Projets complétés
- Tâches en retard

**Row 2 — Charts:**
- Left (line chart): Pitches envoyés par mois (last 6 months)
- Right (donut chart): Répartition des pitches (pending / accepted / rejected / withdrawn)

**Row 3 — Charts:**
- Left (bar chart): Projets par statut
- Right (line chart): Revenus contractualisés par mois (if data available)

**Row 4 — Table:**
- Productivité des membres: name | jobTitle | tasks assigned | tasks done | overdue tasks

Use MUI charts (or recharts — install if needed) for the chart components.

### 3. Install charting library if not present

```bash
cd frontend
npm install recharts
```

### 4. Add Analytics to AgencyDashboard navigation

In `frontend/src/pages/dashboard/AgencyDashboard.js`:
- Director nav already has "analytics" label — ensure it routes to `<DirectorAnalytics>`
- Pass `agencyId` as prop

---

## Files to Create

```
backend/controllers/analyticsController.js              NEW
backend/routes/analyticsRoutes.js                       NEW
frontend/src/services/analyticsService.js               NEW
frontend/src/pages/dashboard/agency/DirectorAnalytics.js  NEW
```

## Files to Modify

```
backend/server.js
    - ADD analyticsRoutes mount

frontend/src/pages/dashboard/AgencyDashboard.js
    - Wire "analytics" nav item to DirectorAnalytics page
```

---

## Acceptance Criteria

- [ ] Director can access "Analytique" from the agency dashboard nav
- [ ] Page shows 4 KPI cards with real data (not mock)
- [ ] Pitches-over-time line chart renders with last 6 months data
- [ ] Pitch status donut chart renders
- [ ] Projects-by-status bar chart renders
- [ ] Member productivity table lists all members with task counts
- [ ] All data is scoped to the logged-in agency only
- [ ] No analytics visible to commercial or worker roles
