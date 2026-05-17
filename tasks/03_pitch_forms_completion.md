# Task 03 — Pitch Forms Completion

**Priority:** 🔴 Critical
**Depends on:** nothing
**Blocks:** nothing

---

## Why This Exists

Two pitch form gaps:

1. **Agency → Freelancer pitch** (`agency_to_freelancer`): The `pitchType` and `contractType` fields exist on the backend, but the CONVENTION DE COLLABORATION structure (Articles 01–11) is not mapped to distinct form fields in the frontend PitchForm.

2. **Agency → Client 5-step pitch form**: Backend fields are complete. A "version 2" 5-step form reportedly exists in the codebase, but there is a known "version 1" skeleton that only renders two selects. The correct version needs to be verified as active, and all strategy/content/analysis sections need to be confirmed rendering properly.

---

## Sub-Task A — Agency → Client: 5-Step Form Verification

### What to Verify

Open `frontend/src/components/pitches/PitchForm.jsx` and check:

1. When `pitchType === "agency_to_client"`, does the form render all 5 steps?
2. Are all these sections present?
   - Step 1: Basic info (title, description, pitchType selector)
   - Step 2: Stratégie & Planification (strategyOverview, creativeIdea, objectives, measurableGoals, techniques)
   - Step 3: Contenu (contentPillars, publicationCalendar, postingFrequency, feedOrganization)
   - Step 4: Analyse & Cible (competitiveAnalysis, colorPalette, inspiration, positioningStrategy, targetAudience: ageMin/ageMax/gender/niche/locations)
   - Step 5: Financier & Timeline (proposedPrice.amount, currency, timeline.duration/unit/startDate/endDate, attachments, notes)
3. Is this form correctly opened from `CommercialBrowse` and `DirectorFlaggedPosts` for agency users?
4. Is `internalStatus` set to "draft" on submit (not "sent" directly)?

### Fixes if Broken

- If the wrong (skeleton) version is active: replace the import in `AgencyDashboard.js` with the correct full 5-step component
- If a step is missing fields: add the missing `<TextField>` / `<Select>` inputs mapped to the correct backend field names
- Ensure the submit payload maps to: `strategy{}`, `content{}`, `analysis{}`, `targetAudience{}`, `proposedPrice{}`, `timeline{}`, `attachments[]`

---

## Sub-Task B — Agency → Freelancer: CONVENTION DE COLLABORATION Form

### Backend Changes

None needed. `Pitch` model already has:
- `pitchType: "agency_to_freelancer"`
- `contractType: "cdd" | "cdi"`
- `description`, `workRequirements`, `proposedPrice`, `timeline`

The CONVENTION articles map to existing fields. What's missing is a structured form that presents them article by article.

### Frontend Changes

#### 1. New Component: `frontend/src/components/pitches/ConventionCollaborationForm.jsx`

A dedicated modal/form for `agency_to_freelancer` pitches, structured by article:

**ARTICLE 01 : OBJET DE LA CONVENTION**
- Field: `description` (textarea — describes the collaboration purpose)

**ARTICLE 02 : CONDITIONS D'EXPLOITATION DES ATTRIBUTS**
- Field: `workRequirements` (textarea — platforms, deliverables, usage rights)

**ARTICLE 03 : OBLIGATIONS DE LA PERSONNALITÉ**
- Read-only: display standard freelancer obligations text (non-editable)
- Optional note field for custom terms

**ARTICLE 04 : OBLIGATION ET ENGAGEMENT DE L'AGENCE**
- Read-only: display standard agency obligations text
- Optional note field

**ARTICLE 05 : RÉTRIBUTION, MODALITÉ ET CONDITION DE PAIEMENT**
- `proposedPrice.amount` (number)
- `proposedPrice.currency` (default DZD)
- Payment method dropdown (virement, chèque, espèces, autre)
- Payment schedule (textarea)

**ARTICLE 06 : LISTE DES RÉSEAUX SOCIAUX**
- Multi-select checkboxes: Instagram, TikTok, YouTube, LinkedIn, Twitter, Facebook, Snapchat, Other

**ARTICLE 07 : DURÉE DE LA CONVENTION**
- `timeline.startDate`
- `timeline.endDate`
- `contractType` (CDD / CDI toggle)

**ARTICLE 08 : CONFIDENTIALITÉ**
- Toggle (default: oui)

**ARTICLE 09 : LITIGES**
- Read-only: standard clause

**ARTICLE 10 : AVENANT**
- Read-only: standard clause
- Optional textarea for amendments

**ARTICLE 11 : DATE D'EFFET**
- Date picker (defaults to today)

**Actions:**
- "Envoyer la Convention" → submits pitch with `pitchType: "agency_to_freelancer"` and `internalStatus: "draft"`

#### 2. Update PitchForm routing

In `frontend/src/components/pitches/PitchForm.jsx`:
- When `pitchType === "agency_to_freelancer"`, render `<ConventionCollaborationForm>` instead of the generic form

#### 3. Where this form is triggered

Agency director can send a convention to a freelancer from:
- DirectorMembers page (attach a freelancer → triggers this form)
- BrowsePosts/Providers page (when an agency finds a freelancer to hire)

---

## Files to Create

```
frontend/src/components/pitches/ConventionCollaborationForm.jsx   NEW
```

## Files to Modify

```
frontend/src/components/pitches/PitchForm.jsx
    - Verify 5-step Agency→Client sections are all rendering
    - Add conditional render of ConventionCollaborationForm when pitchType = agency_to_freelancer

frontend/src/pages/dashboard/agency/DirectorMembers.js
    - Add "Envoyer une Convention" action button on each freelancer card
```

---

## Acceptance Criteria

### Agency → Client (5-step):
- [ ] Form opens from both CommercialBrowse and DirectorFlaggedPosts
- [ ] All 5 steps render with all required fields
- [ ] Submitted payload contains strategy{}, content{}, analysis{}, targetAudience{} objects
- [ ] internalStatus is "draft" on submit (not sent directly to client)

### Agency → Freelancer (CONVENTION):
- [ ] Selecting agency_to_freelancer pitch type opens ConventionCollaborationForm
- [ ] All 11 articles are presented in order
- [ ] Articles with read-only standard text display correctly
- [ ] Submitted payload includes contractType, timeline, proposedPrice, workRequirements, description
- [ ] Director can trigger this from DirectorMembers page for a specific freelancer
