# Task 01 — Authentication & Registration

## What's Already Done
- JWT in HTTP-only cookies (login / logout / /me)
- Role auto-detection login (searches all 7 models)
- Register: Client (person / company), Agency, Team, Freelancer
- Register: AgencyMember (created by director, force password change on first login)
- Middleware: protect, authorize, adminOnly, optionalAuth
- PrivateRoute by role on frontend
- Login page, Register page, Unauthorized page, ChangePasswordPage

---

## Goals
- Complete registration forms with all fields from the spec
- Agency registration must include specialty selection and filiale/parent logic
- Freelancer registration must include `num carte auto entrepreneur` field
- Registration UI must use dropdowns/selectors wherever possible (no free text for structured data)
- Frontend labels in French, internal code in English

---

## Backend Tasks

- [ ] **Add `carteAutoEntrepreneur` field to Freelancer model**
  - File: `backend/models/Freelancer.js`
  - Add: `carteAutoEntrepreneur: { type: String, trim: true }`

- [ ] **Add filiale/parent logic to Agency model**
  - File: `backend/models/Agency.js`
  - Add: `agencyType: { type: String, enum: ["main", "filiale"], default: "main" }`
  - Add: `parentAgency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", default: null }`

- [ ] **Add validation: min price must be <= max price on Post**
  - File: `backend/models/Post.js` or `backend/controllers/postController.js`
  - Reject request if `budget.min > budget.max`

- [ ] **Stricter backend validation on register**
  - Reject numeric-only names (firstName, lastName, agencyName, teamName)
  - Regex: `/^[^\d]+$/` or similar

---

## Frontend Tasks

- [ ] **Add agency specialties picker to Register form**
  - File: `frontend/src/pages/auth/Register.js`
  - When role = agency, show a multi-select checkbox group for specialties:
    `Events`, `360 Marketing`, `ATL`, `BTL`, `Production`, `Brand Marketing`
  - Send as `specialties: []` array in register payload

- [ ] **Add agency filiale toggle to Register form**
  - File: `frontend/src/pages/auth/Register.js`
  - When role = agency, add radio: `Type d'agence` → `Agence principale` / `Filiale`
  - If filiale selected: show a text input `Agence mère` (parent agency name or ID)
  - Send `agencyType` and `parentAgency` in payload

- [ ] **Add `Numéro carte auto-entrepreneur` field to Freelancer register form**
  - File: `frontend/src/pages/auth/Register.js`
  - When role = freelancer, add optional text input for `carteAutoEntrepreneur`

- [ ] **Replace free-text fields with selectors wherever possible**
  - `industry` on Client → dropdown (e.g. Tech, Retail, Food, Real Estate, etc.)
  - `companySize` on Client → already enum, make sure it's a `<select>` not free text
  - `region` / `country` → dropdowns (Algerian wilayas for region)
