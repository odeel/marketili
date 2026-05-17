# Task 08 — Notification Director-Only Filter

**Status:** 🟡 Partial — all notification types fire but no role filter  
**Effort:** Small (backend logic change + model tweak)

---

## What's Missing

Currently, when a contract or project notification is created, it's sent to the agency's main account (`recipient: agencyId`). The spec says only the **director** should receive contract/project notifications — not all agency members. The `Notification` model and `notify()` method need to handle recipient role filtering.

---

## Current Behavior

In `Notification.notify()` (likely `backend/models/Notification.js`):
```js
// Creates a notification for recipient (agency _id)
// But when an agency_member director logs in, they see a different account
```

The issue: agency `_id` and agency director member `_id` are different. Notifications go to the agency model, but the director logs in as an `AgencyMember`.

---

## Backend Work

### 1. Audit `Notification.notify()` call sites for contract/project events

Check `contractController.js` and `projectController.js` for `Notification.notify()` calls. Find where `recipient` and `recipientModel` are set.

### 2. Add director lookup helper

In `backend/utils/findDirector.js` (new file):
```js
const AgencyMember = require("../models/AgencyMember");

async function findDirectorId(agencyId) {
  const director = await AgencyMember.findOne({
    agency: agencyId,
    jobTitle: "director",
    accountStatus: "active",
  }).select("_id").lean();
  return director?._id || null;
}

module.exports = findDirectorId;
```

### 3. Update contract/project notification calls

Wherever `Notification.notify({ recipient: agencyId, recipientModel: "Agency" })` is called for **contract** or **project** events, replace with:

```js
const findDirectorId = require("../utils/findDirector");
const directorId = await findDirectorId(agencyId);
if (directorId) {
  Notification.notify({
    recipient: directorId,
    recipientRole: "agency_member",
    recipientModel: "AgencyMember",
    // ...rest of notification
  });
}
// Still send to agency model as fallback if no director found
Notification.notify({
  recipient: agencyId,
  recipientRole: "agency",
  recipientModel: "Agency",
  // ...
});
```

This ensures the director (logged in as AgencyMember) gets the notification in their dashboard, while the agency account also retains it as a fallback.

### 4. Apply to these specific event types

Only change routing for these categories (not all notifications):
- `category: "contracts"` — all contract status changes
- `category: "projects"` — project_created, project_milestone, project_completed

Leave `category: "pitches"` as-is (directors see pitches too, but so do other roles depending on internal workflow).

---

## Frontend Work

No frontend change required. The notification system already filters by `recipientModel` when the user loads their notifications — once the backend sends to the right recipient, it will appear automatically.

---

## Acceptance Criteria

- [ ] When a contract notification fires for an agency, it is also sent to the agency's director AgencyMember
- [ ] When a project notification fires, the director receives it in their notifications panel
- [ ] Regular agency members (strategist, commercial, etc.) do NOT receive contract notifications unless they are the director
- [ ] If no active director exists for an agency, the notification falls back to the agency account
