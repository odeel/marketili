# Task 09 — Client Profile: Industry / Field of Work Field

**Status:** 🟡 Partial — `bio` and `achievements` exist, no structured industry field  
**Effort:** Tiny (model field + profile controller + edit form + public display)

---

## What's Missing

The Client model has `bio` and `achievements[]` but no dedicated `industry` or `fieldOfWork` field. The spec says client profiles should show their field of activity (sector/industry). Providers browsing a client's public profile should immediately understand what the client does.

---

## Backend Work

### 1. Check if `industry` already exists on Client model

Read `backend/models/Client.js`. The `industry` field may already exist (it was listed in earlier audit). If it exists: skip model change.

If missing, add after `bio`:
```js
industry: {
  type: String,
  trim: true,
  maxlength: 100,
},
fieldOfWork: {
  type: String,
  trim: true,
  maxlength: 200,
},
```

### 2. Update `backend/controllers/profileController.js`

In the client allowed fields list, ensure `"industry"` and `"fieldOfWork"` are included:
```js
const ALLOWED = ["bio", "avatar", "industry", "fieldOfWork", "location", "achievements"];
```

---

## Frontend Work

### 1. `frontend/src/pages/EditProfilePage.js`

In the client fields array, add:
```js
{ name: "industry",    label: "Secteur d'activité",    type: "text" },
{ name: "fieldOfWork", label: "Domaine / Description",  type: "text" },
```

Initialize in form state:
```js
industry:    p.industry    || "",
fieldOfWork: p.fieldOfWork || "",
```

### 2. `frontend/src/pages/ProfilePage.js`

On a client's public profile, show below the name/avatar section:

```jsx
{profile.industry && (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 12px", borderRadius: 20,
    background: "#fff0f0", color: "#c0152a",
    fontSize: "0.8rem", fontWeight: 700, marginBottom: 8 }}>
    {profile.industry}
  </div>
)}
{profile.fieldOfWork && (
  <p style={{ fontSize: "0.84rem", color: "#6b7280", marginTop: 4 }}>
    {profile.fieldOfWork}
  </p>
)}
```

This appears before the bio, giving providers an instant context about what the client does.

### 3. `frontend/src/pages/BrowseProvidersPage.js`

No change needed here — clients aren't listed on the browse page.

---

## Acceptance Criteria

- [ ] `industry` and `fieldOfWork` fields exist on Client model
- [ ] Client can edit them from EditProfilePage
- [ ] Both fields appear on the public ProfilePage for clients
- [ ] Fields saved via PATCH /profile/me correctly persist
