# Task 04 — Agency→Freelancer CONVENTION DE COLLABORATION Pitch Form

**Status:** ❌ Not implemented (form exists but articles not mapped)  
**Effort:** Medium (frontend only — Pitch model fields already exist)

---

## What's Missing

When an agency sends a pitch to a freelancer (`pitchType: "agency_to_freelancer"`), the spec calls it a "CONVENTION DE COLLABORATION" with 11 specific articles. The backend Pitch model has the fields. The current `PitchForm.js` either shows generic fields or doesn't route to a specific agency_to_freelancer variant.

Need to check and build the dedicated form variant.

---

## Backend Work

### Verify Pitch model has these fields

Check `backend/models/Pitch.js` for the agency_to_freelancer fields. Based on prior audit, it should have `strategy{}`, `content{}`, `analysis{}`, `targetAudience{}`. Confirm it also has fields for the CONVENTION articles or add a `convention` subdocument:

```js
convention: {
  article1:  String,  // Objet de la collaboration
  article2:  String,  // Durée
  article3:  String,  // Missions du freelancer
  article4:  String,  // Rémunération et modalités de paiement
  article5:  String,  // Confidentialité
  article6:  String,  // Propriété intellectuelle
  article7:  String,  // Indépendance — statut d'auto-entrepreneur
  article8:  String,  // Obligations de l'agence
  article9:  String,  // Résiliation
  article10: String,  // Responsabilité
  article11: String,  // Litiges et loi applicable
}
```

If missing, add it to `Pitch.js` as an optional subdocument (no `required`).

Update `backend/controllers/Pitchcontroller.js` `sendPitch` to include `convention` in allowed fields.

---

## Frontend Work

### 1. Locate the current PitchForm

Find `frontend/src/components/posts/PitchForm.js` (or wherever it lives). Check if it branches on `pitchType`.

### 2. Add `ConventionPitchForm` variant

When `pitchType === "agency_to_freelancer"`, render a dedicated form with 11 article fields.

**Structure (single page, scrollable):**

```
Header: "CONVENTION DE COLLABORATION"
Sub: Agence [agencyName] ↔ Freelancer [freelancerName]

Section: Informations générales
  - Durée proposée (input)
  - Budget / Rémunération (number input)
  - Type de collaboration (select: ponctuel / récurrent / CDI-équivalent)

Section: Articles de la convention
  Article 1 — Objet de la collaboration          (textarea, pre-filled)
  Article 2 — Durée                               (textarea, pre-filled)
  Article 3 — Missions du freelancer              (textarea, pre-filled)
  Article 4 — Rémunération et modalités           (textarea, pre-filled, shows budget amount)
  Article 5 — Confidentialité                     (textarea, pre-filled)
  Article 6 — Propriété intellectuelle            (textarea, pre-filled)
  Article 7 — Indépendance / auto-entrepreneur    (textarea, pre-filled)
  Article 8 — Obligations de l'agence             (textarea, pre-filled)
  Article 9 — Résiliation                         (textarea, pre-filled)
  Article 10 — Responsabilité                     (textarea, pre-filled)
  Article 11 — Litiges et loi applicable          (textarea, pre-filled)

Footer:
  [Envoyer la convention] button
```

**Default boilerplate for each article:**

```js
const CONVENTION_DEFAULTS = (agencyName, freelancerName) => ({
  article1:  `La présente convention a pour objet de définir les conditions dans lesquelles ${freelancerName} apportera ses services à ${agencyName}.`,
  article2:  "La présente convention prend effet à compter de sa signature pour une durée de [X] mois.",
  article3:  "Le freelancer s'engage à réaliser les missions suivantes : [description des missions].",
  article4:  "En contrepartie, l'agence versera au freelancer la somme de [montant] DZD selon les modalités convenues.",
  article5:  "Le freelancer s'engage à ne pas divulguer les informations confidentielles de l'agence et de ses clients.",
  article6:  "Les travaux réalisés dans le cadre de cette convention deviennent propriété de l'agence après paiement.",
  article7:  `${freelancerName} intervient en qualité d'auto-entrepreneur indépendant, sans lien de subordination.`,
  article8:  `${agencyName} s'engage à fournir au freelancer les ressources nécessaires à l'exécution de ses missions.`,
  article9:  "Chaque partie peut mettre fin à la présente convention avec un préavis de 15 jours.",
  article10: "Chaque partie est responsable de ses propres actes dans l'exercice de ses missions.",
  article11: "Tout litige sera soumis à la juridiction compétente d'Alger. La loi algérienne s'applique.",
});
```

### 3. Routing

In the parent component that renders PitchForm:
```jsx
if (pitchType === "agency_to_freelancer") {
  return <ConventionPitchForm freelancerId={targetId} freelancerName={targetName} onSubmit={...} />;
}
```

This typically happens from `DirectorMembers.js` or `FreelancerCollaborations.js` when a director wants to formally invite a freelancer.

### 4. Display in Freelancer dashboard

When a freelancer receives a pitch of type `agency_to_freelancer`, show the convention articles in a read-only "Détail de la convention" view in `FreelancerCollaborations.js` or a modal.

---

## Acceptance Criteria

- [ ] Convention subdocument added to Pitch model (if missing)
- [ ] `sendPitch` controller saves convention fields
- [ ] Agency director sees a CONVENTION form with 11 pre-filled articles when pitching a freelancer
- [ ] Articles are editable before submission
- [ ] Freelancer sees the full convention article text in their received pitches
