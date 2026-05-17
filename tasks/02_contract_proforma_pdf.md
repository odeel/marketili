# Task 02 — Contract Proforma Form + PDF Generation

**Priority:** 🔴 Critical
**Depends on:** Task 01 (chat system — PDF is sent through chat)
**Blocks:** nothing after this

---

## Why This Exists

The spec defines a full contract workflow:
1. Agency fills Contrat Proforma form
2. System auto-generates PDF
3. PDF is sent through chat
4. Client uploads receipt
5. Agency sends Bon de Commande

Step 1–3 are entirely missing. The `Contract` model has a `contractPdf` field to store the file reference, but:
- No multi-article form UI exists (PRÉAMBULE + ARTICLES 01–15)
- No PDF generation library is integrated
- The PDF is never created or sent to chat

---

## Scope

Build the Contrat Proforma multi-article form for the agency director, add server-side PDF generation (pdfkit or puppeteer), save the PDF to GridFS, and have the system automatically post it into the project chat thread.

---

## Backend Work

### 1. Install PDF generation library

```bash
cd backend
npm install pdfkit
```

Use `pdfkit` (lightweight, no headless browser needed).

### 2. New util: `backend/utils/generateContractPdf.js`

Function: `generateContractPdf(contractData)` → returns a Buffer of the PDF.

The PDF layout must include:
- Header: agency logo placeholder, date, contract reference number
- PRÉAMBULE: parties identification (partyA name/address, partyB name/address)
- ARTICLE 01 : OBJET DU CONTRAT — `contract.objet`
- ARTICLE 02 : NATURE DES PRESTATIONS — `contract.prestations`
- ARTICLE 03 : PÉRIMÈTRE DU PROJET ET LIVRABLES — `contract.livrables`
- ARTICLE 04 : OBLIGATIONS DES PARTIES — standard clause
- ARTICLE 05 : DISPOSITIONS FINANCIÈRES — `contract.financialTerms.amount`, currency, payment method
- ARTICLE 06 : RÉVISION DES PRIX — standard clause
- ARTICLE 07 : MODALITÉS DE PAIEMENT — `contract.financialTerms.paymentSchedule`
- ARTICLE 08 : DURÉE — `contract.duration.startDate` to `contract.duration.endDate`
- ARTICLE 09 : CONFIDENTIALITÉ — `contract.confidentialityClause`
- ARTICLE 10 : CLAUSE D'EXCLUSIVITÉ — `contract.exclusivityClause`
- ARTICLE 11 : FORCE MAJEURE — standard clause
- ARTICLE 12 : DISPOSITIONS DIVERSES — `contract.additionalClauses`
- ARTICLE 13 : RÈGLEMENT DES LITIGES — standard clause
- ARTICLE 14 : RÉSILIATION — `contract.resiliationTerms`
- ARTICLE 15 : ÉLECTION DE DOMICILE — parties addresses
- Footer: signature blocks (no digital signature — just printed name + date lines)

### 3. Update `backend/controllers/contractController.js`

Add new endpoint: `generateAndSendPdf(contractId)`

Logic:
1. Load contract (with project, partyA, partyB populated)
2. Call `generateContractPdf(contract)` → get PDF buffer
3. Upload buffer to GridFS (use `conn().db.collection('uploads.files')` pattern already in db.js)
4. Update `contract.contractPdf = { fileId, filename, url, generatedAt }`
5. Save contract
6. Find (or create) the project's conversation via chatController logic
7. Post a system message of type `contract_pdf` into the conversation with the file reference
8. Trigger notification to client: "Contrat envoyé, veuillez envoyer un reçu"
9. Update contract status to "sent"

### 4. New Route in `backend/routes/contractRoutes.js`

```
POST /api/contracts/:id/generate-pdf    → generateAndSendPdf (agency director only)
```

### 5. Update `backend/services/contractService.js` (if applicable)

---

## Frontend Work

### 1. New Component: `frontend/src/components/contracts/ContratProformaForm.jsx`

A multi-step form (or single scrollable form) with sections matching the contract articles:

**Section: Parties**
- Party A (agency): pre-filled from auth user (agencyName, address)
- Party B (client): pre-filled from project.client
- Contract reference number (auto or manual)
- Contract date

**Section: Objet & Prestations**
- Objet du contrat (textarea)
- Nature des prestations (textarea)
- Périmètre et livrables (textarea)

**Section: Financier**
- Montant (number)
- Devise (DZD default)
- Modalité de paiement (dropdown: virement, chèque, espèces, autre)
- Calendrier de paiement (textarea)

**Section: Durée**
- Date de début
- Date de fin
- Notes sur la durée

**Section: Clauses**
- Confidentialité (toggle, default on)
- Exclusivité (toggle, default off)
- Clauses de résiliation (textarea)
- Clauses additionnelles (textarea)

**Actions:**
- "Prévisualiser" — opens PDF preview (calls generate-pdf, opens in new tab)
- "Générer et envoyer" — generates PDF, sends to chat, notifies client

### 2. Integrate into DirectorContracts

In `frontend/src/pages/dashboard/agency/DirectorContracts.js`:
- When a contract is in "draft" status and the actor is director, show a "Remplir le Contrat Proforma" button
- Clicking opens `ContratProformaForm` modal or navigates to form page
- On submit: call `contractService.generateAndSendPdf(contractId)`

### 3. New Service Method: `contractService.generatePdf(contractId)`

```js
generatePdf: (id) => api.post(`/contracts/${id}/generate-pdf`)
```

---

## Files to Create

```
backend/utils/generateContractPdf.js                    NEW
frontend/src/components/contracts/ContratProformaForm.jsx   NEW
```

## Files to Modify

```
backend/controllers/contractController.js   ADD generateAndSendPdf()
backend/routes/contractRoutes.js            ADD POST /:id/generate-pdf
frontend/src/services/contractService.js    ADD generatePdf()
frontend/src/pages/dashboard/agency/DirectorContracts.js  ADD Proforma button + modal
```

---

## Acceptance Criteria

- [ ] Director can open the Contrat Proforma form from the contracts page
- [ ] All 15 article sections are present and fillable
- [ ] Clicking "Générer et envoyer" produces a real PDF file
- [ ] PDF is saved to GridFS and linked on the contract record
- [ ] PDF appears as a `contract_pdf` message in the project chat
- [ ] Client receives a notification to upload a receipt
- [ ] Contract status advances to "sent" automatically
