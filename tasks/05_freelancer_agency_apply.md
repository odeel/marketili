# Task 05 — Freelancer Apply / Agency Invite Workflow

**Priority:** 🟠 Priority 2
**Depends on:** Task 04 (notifications — invite notification is part of this flow)
**Blocks:** nothing

---

## Why This Exists

The `Freelancer` model has `agencyCollaborations[]` ready, and the spec says:
> "they can also send an application to teams, agencies or collaboration proposal to clients or other freelancers"

Currently there is no way for a freelancer to apply to join an agency or team, and no way for an agency to send an invitation to a specific freelancer without first creating a pitch on a post. The `agencyMemberController` can attach/detach freelancers but there is no invitation workflow, no request model, and no UI.

---

## Scope

A simple request-based workflow:
- A freelancer sends a **collaboration request** to an agency or team (or a client for a direct partnership)
- The agency director reviews it and either accepts or declines
- Accepting creates an `agencyCollaborations` entry on the freelancer and notifies both parties
- Alternatively, an agency director can **invite** a freelancer directly

---

## Backend Work

### 1. New Model: `backend/models/CollaborationRequest.js`

Fields:
- `fromType` enum: "Freelancer" | "Agency" (who initiated)
- `fromId` (no explicit ref — matches by role)
- `fromName`
- `toType` enum: "Agency" | "Team" | "Client"
- `toId`
- `toName`
- `message` (optional cover note)
- `proposedRole` (optional, e.g., "designer", "smm")
- `status` enum: "pending" | "accepted" | "declined" | "withdrawn"
- `respondedAt`
- `declineReason`
- timestamps

### 2. New Controller: `backend/controllers/collaborationRequestController.js`

Endpoints:

**`sendRequest(fromId, fromType, toId, toType, message, proposedRole)`**
- POST `/api/collaboration-requests`
- Creates CollaborationRequest with status "pending"
- Triggers notification to target: `type: "collaboration_request"`, `category: "pitches"`, title: "Demande de collaboration reçue", body: `${fromName} souhaite collaborer avec vous.`

**`getMyRequests(userId, userRole)`**
- GET `/api/collaboration-requests/mine`
- Returns requests sent by the current user (paginated)

**`getIncomingRequests(userId, userRole)`**
- GET `/api/collaboration-requests/incoming`
- Returns requests received by the current user (paginated, filterable by status)

**`respondToRequest(requestId, action, declineReason?)`**
- PATCH `/api/collaboration-requests/:id/respond`
- `action`: "accept" | "decline"
- On accept:
  - Push entry into `freelancer.agencyCollaborations[]`: `{ agency: toId, role: proposedRole, startDate: now, status: "active" }`
  - Update request status to "accepted"
  - Notify freelancer: "Votre demande de collaboration a été acceptée"
- On decline:
  - Update request status to "declined"
  - Set `declineReason`
  - Notify freelancer: "Votre demande de collaboration a été refusée"

**`withdrawRequest(requestId)`**
- PATCH `/api/collaboration-requests/:id/withdraw`
- Only callable by the sender (fromId)
- Sets status "withdrawn"

### 3. New Routes: `backend/routes/collaborationRequestRoutes.js`

```
POST   /api/collaboration-requests              → sendRequest
GET    /api/collaboration-requests/mine         → getMyRequests
GET    /api/collaboration-requests/incoming     → getIncomingRequests
PATCH  /api/collaboration-requests/:id/respond  → respondToRequest (agency/team only)
PATCH  /api/collaboration-requests/:id/withdraw → withdrawRequest (freelancer only)
```

All routes: `protect` middleware.

### 4. Update `backend/server.js`

Mount: `app.use('/api/collaboration-requests', collaborationRequestRoutes)`

---

## Frontend Work

### 1. New Service: `frontend/src/services/collaborationRequestService.js`

Methods:
- `sendRequest(data)` — POST `/collaboration-requests`
- `getMine(params)` — GET `/collaboration-requests/mine`
- `getIncoming(params)` — GET `/collaboration-requests/incoming`
- `respond(id, action, declineReason)` — PATCH `/collaboration-requests/:id/respond`
- `withdraw(id)` — PATCH `/collaboration-requests/:id/withdraw`

### 2. Freelancer → Apply to Agency / Team

In `frontend/src/pages/dashboard/freelancer/FreelancerBrowse.js`:
- When browsing providers and the target is an Agency or Team:
  - Show "Proposer une collaboration" button on the provider card
  - Opens a small modal: message textarea + proposedRole dropdown
  - Submits via `collaborationRequestService.sendRequest()`

In `frontend/src/pages/BrowseProvidersPage.js`:
- Same "Proposer une collaboration" button visible to freelancer role
- Opens the same modal

### 3. Agency Director → Incoming requests

In `frontend/src/pages/dashboard/agency/DirectorMembers.js`:
- Add a "Demandes reçues" tab or section (alongside member list)
- Lists incoming collaboration requests with: freelancer name, proposed role, message, status
- Accept / Decline buttons with optional decline reason input

### 4. Freelancer → My sent requests

In `frontend/src/pages/dashboard/FreelancerDashboard.js`:
- Add a "Mes demandes" tab in the Collaborations section
- Shows sent requests with their status (pending / accepted / declined / withdrawn)
- "Retirer" button for pending requests

### 5. New Component: `frontend/src/components/collaborations/CollaborationRequestModal.jsx`

Reusable modal used from browse pages:
- Target name (pre-filled, read-only)
- Proposed role (dropdown: designer, smm, community_manager, editor, filmmaker, photographer, autre)
- Message (textarea, optional)
- Submit button

---

## Files to Create

```
backend/models/CollaborationRequest.js                              NEW
backend/controllers/collaborationRequestController.js               NEW
backend/routes/collaborationRequestRoutes.js                        NEW
frontend/src/services/collaborationRequestService.js                NEW
frontend/src/components/collaborations/CollaborationRequestModal.jsx  NEW
```

## Files to Modify

```
backend/server.js
    - ADD collaborationRequestRoutes mount

frontend/src/pages/BrowseProvidersPage.js
    - ADD "Proposer une collaboration" button for freelancer users

frontend/src/pages/dashboard/freelancer/FreelancerBrowse.js
    - ADD "Proposer une collaboration" button on agency/team cards

frontend/src/pages/dashboard/FreelancerDashboard.js
    - ADD "Mes demandes" section under Collaborations

frontend/src/pages/dashboard/agency/DirectorMembers.js
    - ADD "Demandes reçues" tab with accept/decline UI
```

---

## Acceptance Criteria

- [ ] Freelancer can browse providers and send a collaboration request to an agency or team
- [ ] Agency director sees incoming requests in the Members section
- [ ] Director can accept or decline with an optional reason
- [ ] On accept, the freelancer's agencyCollaborations[] is updated and the context card appears in their dashboard
- [ ] On decline, the freelancer receives a notification with the reason
- [ ] Freelancer can view and withdraw their pending requests
- [ ] All status changes trigger the correct notifications
