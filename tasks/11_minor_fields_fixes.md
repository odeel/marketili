# Task 11 — Minor Field & UX Fixes

**Priority:** 🔵 Priority 4
**Depends on:** nothing
**Blocks:** nothing

---

## Why This Exists

Several small gaps remain from the spec that don't warrant their own task file but should not be forgotten:

1. **Post: no dedicated `objectives` field** — spec lists Objectives as a separate post field
2. **Client: no `achievements` field** — profiles have bio but no achievements section
3. **Provider direct-post to client** — no UI for a provider to initiate sending a post/proposal directly to a specific client (the `sendPostToProvider` endpoint exists in reverse, but provider-initiated is missing)
4. **Search uniformity** — search and filters exist in posts and provider browse, but are inconsistent or absent in pitches lists, projects lists, and contracts lists
5. **Notification: messages category** — `messages` is a notification category but the chat system (Task 01) will trigger it; ensure the category is wired once chat is done

---

## Fix 1 — Post: `objectives` Field

### Backend

In `backend/models/Post.js`:
- Add field: `objectives` (String, optional, maxlength 500)

In `backend/controllers/postController.js`:
- `createPost()`: read `req.body.objectives` and save it
- `updatePost()`: allow `objectives` in the update payload
- `getPosts()` and `getPost()`: include `objectives` in responses (no change needed if using `.lean()`)

### Frontend

In `frontend/src/components/posts/CreatePostModal.jsx`:
- Add a textarea input: label "Objectifs" (between Description and Budget)
- Placeholder: "Quels sont les objectifs principaux de ce projet ?"
- Map to `objectives` in the submit payload

In post detail view (wherever a post's full detail is shown to providers browsing):
- Display "Objectifs" section below description if `post.objectives` is not empty

---

## Fix 2 — Client: `achievements` Field

### Backend

In `backend/models/Client.js`:
- Add field: `achievements[]` (array of Strings, optional)

In `backend/controllers/profileController.js`:
- Add `achievements` to the list of allowed fields for client profile update

### Frontend

In `frontend/src/pages/EditProfilePage.js` (client role section):
- Add a tag-style input for achievements (same pattern as specialties on agency/freelancer)
- Label: "Réalisations / Références"
- Allow adding and removing text tags

In `frontend/src/pages/ProfilePage.js` (client profile view):
- Show "Réalisations" section below bio if `profile.achievements` array is non-empty
- Render as pills/tags

---

## Fix 3 — Provider Direct-Post to Client (Provider Initiates)

### Context

The existing `postService.sendTo()` and `PATCH /posts/:id/send` endpoint sends a client's post TO a specific provider. The reverse (a provider sending a proposal/post DIRECTLY to a client without a pre-existing post) is missing.

This is different from a pitch — it's more of a "prospection" where the provider initiates contact and proposes their services to a specific client.

### Backend

In `backend/models/Post.js`:
- Add `initiatedBy` field: `{ initiatorType: enum["Agency","Team","Freelancer"], initiatorId }` (null for client-created posts)
- This allows a post to be created by a provider targeting a client

In `backend/controllers/postController.js`:
- Update `createPost()` to allow providers (agency, team, freelancer) to create a post targeting a specific client
- When a provider creates a post: set `client` to the targeted clientId, `initiatedBy` to the provider, `isPublic: false`, `status: "open"`, `sentTo: [{ providerType: initiatorType, providerId: initiatorId }]`
- Notify the targeted client: "Vous avez reçu une proposition de collaboration de [providerName]"

### Frontend

In `frontend/src/pages/BrowseProvidersPage.js`:
- When a provider (agency/team/freelancer) views a client's profile, show "Envoyer une proposition" button
- Opening the button: small form with title, description, collaboration type, compensation type, deadline
- Submits as a post creation with `targetClientId` and `initiatedBy`

In client dashboard: proposals received from providers appear in "Posts" list with a visual indicator (e.g., badge: "Proposition reçue") to distinguish them from self-created posts.

---

## Fix 4 — Search & Filter Uniformity

### Goal

Every list in the app should have at minimum: a search bar, a status filter, and a sort. Currently:
- Posts: ✅ full search + filters
- Providers browse: ✅ search + filters
- Pitches list: 🟡 status filter may exist — verify; add search by client/agency name if missing
- Projects list: 🟡 status filter exists — verify search by client name or project title
- Contracts list: 🟡 date + status filters exist — verify search by partyB name
- Notifications: 🟡 category filter — verify search or date filter exists

### What to Add Where

**Pitches list (all roles):**
- Search by: post title, sender/receiver name
- Filter by: status (pending, accepted, rejected, withdrawn)
- Sort by: createdAt desc (default), deadline asc

**Projects list (all roles):**
- Search by: project title, client name
- Filter by: projectStatus (active, in_review, completed, cancelled)
- Sort by: deadline asc (default), createdAt desc

**Contracts list:**
- Search by: party name (partyBName)
- Filter by: status (draft, sent, acknowledged, signed, resiliation)
- Sort by: createdAt desc

These are all frontend-side filters on already-fetched data (no new backend endpoints needed if data is already loaded). For large data sets, add query params to existing backend endpoints.

---

## Fix 5 — Messages Notification Category (Wire after Task 01)

This is a reminder — do not implement until Task 01 (chat) is done.

Once chat is built:
- When a new message arrives in a conversation, trigger a notification: `type: "system"`, `category: "messages"`, title: "Nouveau message", body: "[senderName] vous a envoyé un message."
- This should use `Notification.notify()` from inside `chatController.sendMessage()`
- The notification links to the project chat tab

---

## Files to Modify

```
backend/models/Post.js
    - ADD objectives field
    - ADD initiatedBy field

backend/models/Client.js
    - ADD achievements[] field

backend/controllers/postController.js
    - ADD objectives read/write
    - ADD provider-initiated post creation logic
    - ADD notification to client on provider-initiated post

backend/controllers/profileController.js
    - ADD achievements to client allowed update fields

frontend/src/components/posts/CreatePostModal.jsx
    - ADD objectives textarea

frontend/src/pages/ProfilePage.js
    - ADD achievements display for client profile
    - ADD "Envoyer une proposition" button for provider viewing a client

frontend/src/pages/EditProfilePage.js
    - ADD achievements tag input for client role

frontend/src/pages/BrowseProvidersPage.js
    - ADD "Envoyer une proposition" button when provider views client card

frontend/src/pages/dashboard/ClientDashboard.js
    - ADD visual indicator on posts that were initiated by a provider

[All pitch/project/contract list pages]
    - ADD search inputs and standardize filter/sort controls
```

---

## Acceptance Criteria

- [ ] Post creation form includes an "Objectifs" field
- [ ] Post detail view shows the objectives section when populated
- [ ] Client profile has an achievements section (editable + publicly visible)
- [ ] An agency/freelancer/team can send a direct proposal to a specific client from the browse page
- [ ] Client sees provider-initiated proposals in their posts list with a visual distinction
- [ ] Client receives a notification when a provider sends them a direct proposal
- [ ] Pitches list has search by name + status filter
- [ ] Projects list has search by title/client + status filter
- [ ] Contracts list has search by party name + status filter
