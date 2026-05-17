# Task 10 — Admin: Ads System + Activity Log

**Priority:** 🔵 Priority 4
**Depends on:** nothing
**Blocks:** nothing

---

## Why This Exists

The spec states:
> Admin can: manage users, disable/enable accounts, access statistics, **add fields and options, adds ads**, monitor posts, monitor platform activity.

Two features are entirely absent:

1. **Ads system**: No `Ad` model, no routes, no admin UI to create/manage ads, no frontend placement for ads.
2. **Activity log**: Admin only sees aggregate stats (user counts, post counts). There is no event-based activity feed showing recent platform actions (new registrations, pitches sent, projects created, contracts signed, etc.).

---

## Sub-Task A — Ads System

### Backend

#### 1. New Model: `backend/models/Ad.js`

Fields:
- `title` (required)
- `imageUrl` or `imageFileId` (ref to GridFS upload)
- `linkUrl` (optional — where clicking the ad goes)
- `targetRoles[]` enum: "client" | "agency" | "team" | "freelancer" | "all" (which dashboards see this ad)
- `placement` enum: "sidebar" | "banner" | "card" (where in the UI it appears)
- `isActive` (default true)
- `startDate`, `endDate` (optional campaign window)
- `createdBy` (Admin ref)
- timestamps

#### 2. New endpoints in `backend/controllers/adminController.js`

Or new `backend/controllers/adController.js` (preferred for separation):

- `createAd(data, file?)` — POST `/api/admin/ads` — admin creates ad with optional image upload
- `getAds(placement?, targetRole?, activeOnly?)` — GET `/api/ads` — public endpoint for frontned to fetch active ads
- `getAdminAds()` — GET `/api/admin/ads` — admin lists all ads (including inactive)
- `updateAd(id, data)` — PATCH `/api/admin/ads/:id`
- `deleteAd(id)` — DELETE `/api/admin/ads/:id`
- `toggleAd(id)` — PATCH `/api/admin/ads/:id/toggle` — flip isActive

#### 3. New Routes

In `backend/routes/adminRoutes.js`:
```
POST   /api/admin/ads           → createAd (admin only)
GET    /api/admin/ads           → getAdminAds (admin only)
PATCH  /api/admin/ads/:id       → updateAd (admin only)
PATCH  /api/admin/ads/:id/toggle → toggleAd (admin only)
DELETE /api/admin/ads/:id       → deleteAd (admin only)
```

In `backend/routes/adRoutes.js` (public):
```
GET    /api/ads                 → getAds (no auth required; filters by placement, targetRole)
```

Mount in `backend/server.js`: `app.use('/api/ads', adRoutes)`

### Frontend

#### 1. Admin Ad Management UI

In `frontend/src/pages/dashboard/AdminDashboard.js`:
- Add "Publicités" nav item
- Subpage: list of ads with columns (title, placement, targetRoles, isActive, startDate, endDate, actions)
- "Nouvelle publicité" button → modal:
  - Title input
  - Image upload (single file)
  - Link URL input (optional)
  - Placement dropdown: sidebar, banner, card
  - Target roles multi-select checkboxes
  - Date range (optional)
- Toggle active/inactive per ad
- Delete ad

#### 2. New Service: `frontend/src/services/adService.js`

```js
getAds: (placement, role) => api.get('/ads', { params: { placement, role } })
```

#### 3. Ad Placement Components

**New Component: `frontend/src/components/ads/AdBanner.jsx`**
- Fetches ads with `placement: "banner"` and `targetRoles` including current user's role
- Renders first active ad as a horizontal banner (image + optional CTA button)
- Shown at top of dashboard pages (below the topbar)

**New Component: `frontend/src/components/ads/AdCard.jsx`**
- Renders a single ad card in a sidebar or feed
- If no ads available: renders nothing (null)

Add `<AdBanner>` to `DashboardLayout.jsx` (below topbar, above page content) — visible to all authenticated non-admin users.

---

## Sub-Task B — Admin Activity Log

### Backend

#### 1. New Model: `backend/models/ActivityLog.js`

Fields:
- `actorId` (who did it)
- `actorRole`
- `actorName`
- `actionType` enum: "user_registered" | "user_disabled" | "user_enabled" | "post_created" | "post_closed" | "pitch_sent" | "pitch_accepted" | "project_created" | "project_completed" | "contract_signed" | "ad_created" | "member_created" | "account_restored"
- `targetId` (what was affected)
- `targetType` (Post, User, Pitch, etc.)
- `description` (human-readable string)
- `metadata` (flexible object for extra context)
- timestamps (createdAt only)

#### 2. Logging utility: `backend/utils/logActivity.js`

```js
async function logActivity({ actorId, actorRole, actorName, actionType, targetId, targetType, description, metadata }) {
  await ActivityLog.create({ ... });
}
```

#### 3. Add logging calls to key controllers

Add `logActivity()` calls (non-blocking — fire and forget with `.catch()`) in:
- `authController.register()` → `user_registered`
- `adminController.toggleUserStatus()` → `user_disabled` / `user_enabled`
- `postController.createPost()` → `post_created`
- `postController.closePost()` → `post_closed`
- `Pitchcontroller.sendPitch()` → `pitch_sent`
- `Pitchcontroller.acceptPitch()` → `pitch_accepted`
- `projectController` (auto-create) → `project_created`
- `contractController.sendBonDeCommande()` → `contract_signed`
- `agencyMemberController.createMember()` → `member_created`
- `agencyMemberController.setMemberStatus()` → `account_restored`

#### 4. New endpoint in `backend/controllers/adminController.js`

`getActivityLog(page, limit, actionType?)` — GET `/api/admin/activity`
- Returns paginated activity log, newest first
- Optional filter by actionType

Add to `backend/routes/adminRoutes.js`:
```
GET /api/admin/activity  → getActivityLog (admin only)
```

### Frontend

#### 1. Admin Activity Page

In `AdminDashboard.js`:
- "Activité" nav item (already may exist as "monitor platform activity")
- Full activity feed: paginated list of events, newest first
- Each row: icon (based on actionType), description, actor name, timestamp
- Filter by actionType (dropdown)
- ActionType icons: user (register/disable/enable), file (post), send (pitch), folder (project), contract (contract), warning (disabled)

---

## Files to Create

```
backend/models/Ad.js                            NEW
backend/models/ActivityLog.js                   NEW
backend/utils/logActivity.js                    NEW
backend/routes/adRoutes.js                      NEW
frontend/src/services/adService.js              NEW
frontend/src/components/ads/AdBanner.jsx        NEW
frontend/src/components/ads/AdCard.jsx          NEW
```

## Files to Modify

```
backend/server.js                   ADD adRoutes mount
backend/routes/adminRoutes.js       ADD ad management routes + /activity route
backend/controllers/adminController.js  ADD getActivityLog() + ad CRUD endpoints
backend/controllers/authController.js   ADD logActivity() call in register
backend/controllers/postController.js   ADD logActivity() calls
backend/controllers/Pitchcontroller.js  ADD logActivity() calls
backend/controllers/projectController.js  ADD logActivity() call
backend/controllers/contractController.js  ADD logActivity() call
backend/controllers/agencyMemberController.js  ADD logActivity() calls
frontend/src/components/layout/DashboardLayout.jsx  ADD <AdBanner> below topbar
frontend/src/pages/dashboard/AdminDashboard.js  ADD ads management + activity log pages
```

---

## Acceptance Criteria

### Ads:
- [ ] Admin can create an ad with image, link, placement, and target roles
- [ ] Admin can toggle ads active/inactive
- [ ] Active ads appear in the correct dashboard placement for targeted roles
- [ ] No ads shown to admin users themselves

### Activity Log:
- [ ] Admin sees a paginated event feed of platform activity
- [ ] Events logged: registrations, user status changes, posts, pitches, projects, contracts
- [ ] Each event shows actor name, action description, and timestamp
- [ ] Feed can be filtered by action type
