# Task 03 — Contract Proforma Form UI

**Status:** ❌ Not implemented  
**Effort:** Medium (frontend only — multi-step form, backend fields already exist)  
**Depends on:** Task 02 (PDF generation consumes this form's output)

---

## What's Missing

The `Contract` model already has all needed fields. The existing `DirectorContracts.js` shows contracts but has no form to fill in the PRÉAMBULE → ARTICLE 15 sections. The spec says the agency fills this "Contrat Proforma" before generating the PDF.

Looking at the current Contract model, it has:
- `partyAType`, `partyAId`, `partyAName`
- `partyBType`, `partyBId`, `partyBName`  
- `contractType`, `status`
- But **no `sections` field** for article content

The Contract model needs a `sections` subdocument field, and the frontend needs a multi-step form to fill it.

---

## Backend Work

### 1. Update `backend/models/Contract.js`

Add `sections` field after `contractType`:

```js
sections: {
  preambule:  { type: String, trim: true },
  article1:   { type: String, trim: true },  // Objet du contrat
  article2:   { type: String, trim: true },  // Durée
  article3:   { type: String, trim: true },  // Obligations de l'agence
  article4:   { type: String, trim: true },  // Obligations du client
  article5:   { type: String, trim: true },  // Rémunération
  article6:   { type: String, trim: true },  // Conditions de paiement
  article7:   { type: String, trim: true },  // Propriété intellectuelle
  article8:   { type: String, trim: true },  // Confidentialité
  article9:   { type: String, trim: true },  // Résiliation
  article10:  { type: String, trim: true },  // Force majeure
  article11:  { type: String, trim: true },  // Litiges
  article12:  { type: String, trim: true },  // Loi applicable
  article13:  { type: String, trim: true },  // Modifications
  article14:  { type: String, trim: true },  // Intégralité de l'accord
  article15:  { type: String, trim: true },  // Signatures
},
```

### 2. Update `backend/controllers/contractController.js`

In `updateContract`, allow updating `sections`:

```js
if (body.sections) contract.sections = { ...contract.sections, ...body.sections };
```

No new endpoint needed — use existing `PATCH /contracts/:id`.

### 3. Update `contractService.js` (frontend)

Existing `update(id, data)` method already handles this — no change needed.

---

## Frontend Work

### 1. New component: `frontend/src/pages/dashboard/agency/ContractProformaForm.js`

A multi-section form rendered as a modal or inline panel in `DirectorContracts.js`.

**Structure:**

```
Step 1 — Parties & type (pre-filled from contract, read-only)
Step 2 — PRÉAMBULE + ARTICLE 1 (Objet) + ARTICLE 2 (Durée)
Step 3 — ARTICLE 3 (Agence obligations) + ARTICLE 4 (Client obligations)
Step 4 — ARTICLE 5 (Rémunération) + ARTICLE 6 (Paiement)
Step 5 — ARTICLE 7–12 (IP, confidentialité, résiliation, force majeure, litiges, loi)
Step 6 — ARTICLE 13–15 (Modifications, intégralité, signatures) + Preview
```

Each article has:
- Section title (bold, uppercase, coloured header)
- Default placeholder text (legal boilerplate in French, editable)
- Textarea for the agency to customize

**Default boilerplate strings** (pre-fill textareas so the agency doesn't start from scratch):

```js
const DEFAULTS = {
  preambule: "Entre les soussignés, il a été convenu ce qui suit...",
  article1:  "Le présent contrat a pour objet de définir les conditions dans lesquelles l'agence fournira ses services marketing au client.",
  article2:  "Le présent contrat prend effet à compter de sa signature pour une durée déterminée de [X] mois, renouvelable par accord mutuel.",
  article3:  "L'agence s'engage à fournir les services décrits à l'Article 1 avec professionnalisme et dans les délais convenus.",
  article4:  "Le client s'engage à fournir à l'agence toutes les informations et ressources nécessaires à la bonne exécution des services.",
  article5:  "En contrepartie des services fournis, le client versera à l'agence la somme de [montant] DZD selon les modalités définies à l'Article 6.",
  article6:  "Le paiement sera effectué par virement bancaire dans un délai de 30 jours à compter de la réception de la facture.",
  article7:  "Tous les travaux créés par l'agence dans le cadre du présent contrat restent la propriété du client après paiement intégral.",
  article8:  "Les parties s'engagent à garder confidentielles toutes informations échangées dans le cadre du présent contrat.",
  article9:  "Chaque partie peut résilier le présent contrat avec un préavis de 30 jours par lettre recommandée.",
  article10: "Aucune des parties ne sera tenue responsable d'un manquement à ses obligations dû à un cas de force majeure.",
  article11: "Tout litige relatif au présent contrat sera soumis à la juridiction compétente du lieu du siège de l'agence.",
  article12: "Le présent contrat est régi par le droit algérien.",
  article13: "Toute modification au présent contrat devra faire l'objet d'un avenant écrit signé par les deux parties.",
  article14: "Le présent contrat constitue l'intégralité de l'accord entre les parties et annule tout accord antérieur.",
  article15: "Lu et approuvé — signatures des deux parties.",
};
```

**Form state:**
```js
const [sections, setSections] = useState({ ...DEFAULTS, ...contract.sections });
const [step, setStep] = useState(1);
const [saving, setSaving] = useState(false);
```

**On save (each step or final):**
```js
await contractService.update(contract._id, { sections });
```

**Final step shows a read-only preview** of the full contract text before generating the PDF.

### 2. Wire into `DirectorContracts.js`

In the contract detail drawer/panel:
- Add "Remplir le Proforma" button (visible when `contract.status === "sent"` and user is director)
- Opens `ContractProformaForm` as a modal
- On completion, shows "Générer le PDF" button (Task 02)

---

## Acceptance Criteria

- [ ] Agency director can open the Proforma form from a contract detail view
- [ ] All 16 sections (PRÉAMBULE + 15 articles) are pre-filled with editable boilerplate
- [ ] Sections are saved to the contract via PATCH on each step
- [ ] A read-only preview of the full assembled contract is shown on the final step
- [ ] After completing, the "Générer le PDF" button becomes available
