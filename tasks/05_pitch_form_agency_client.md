# Task 05 — Agency→Client 5-Step Pitch Form Verification & Fix

**Status:** 🟡 Partial — backend complete, frontend routing unconfirmed  
**Effort:** Small (read existing code, fix routing if broken, verify all steps render)

---

## What's Missing

The Agency→Client pitch form (`pitchType: "agency_to_client"`) is a structured 5-step form covering:
1. Strategy & objectives
2. Content pillars & publication calendar
3. Competitive analysis, color palette, positioning
4. Target audience (age, gender, niche, location)
5. Budget & timeline summary

The backend `Pitch` model has `strategy{}`, `content{}`, `analysis{}`, `targetAudience{}`. The concern is whether the frontend form correctly renders all 5 steps and maps each field.

---

## Steps

### 1. Read and audit the current PitchForm

Read `frontend/src/components/posts/PitchForm.js` (or wherever pitch submission lives in the agency flow). Identify:
- Does it branch on `pitchType`?
- Does it render the 5-step version for `agency_to_client`?
- Which fields are present vs missing?

### 2. Also read DirectorFlaggedPosts.js

The pitch form is launched from DirectorFlaggedPosts when a director selects a flagged post to submit. Confirm it passes `pitchType: "agency_to_client"`.

### 3. Cross-reference with Pitch model

Read `backend/models/Pitch.js` to get the exact field names under `strategy`, `content`, `analysis`, `targetAudience`.

### 4. Fix any gaps

If the form is missing steps or fields, add them. Each step should be a separate screen (or collapsible section) with:
- Step 1: `strategy.mainObjective`, `strategy.keyMessages[]`, `strategy.techniques[]`
- Step 2: `content.pillars[]`, `content.publicationFrequency`, `content.platforms[]`
- Step 3: `analysis.competitors[]`, `analysis.colorPalette[]`, `analysis.positioning`
- Step 4: `targetAudience.ageRange`, `targetAudience.gender`, `targetAudience.niche`, `targetAudience.location`
- Step 5: budget, deadline, summary preview → submit

### 5. Verify pitch display on client side

In `ClientDashboard.js` pitch detail view, confirm the strategy/content/analysis/targetAudience sections are displayed to the client when they view the received pitch.

---

## Acceptance Criteria

- [ ] Agency strategist can submit a full 5-step pitch with all strategy, content, analysis, and audience fields
- [ ] Client can view all submitted fields in the pitch detail modal
- [ ] No step is silently skipped or missing from the UI
- [ ] Submitted data is correctly persisted (verify via backend response)
