# Task 06 — Contracts

## What's Already Done
- Contract types: service_agreement, collaboration, cdd, cdi, project
- Full status flow: draft → sent → acknowledged → signed → resiliation
- Create, update (draft), send, upload receipt, send bon de commande, resiliate
- Get by party, by project, by ID
- Client contracts page (list + status filter + detail view)
- Client receipt upload form (for "sent" status)

---

## Goals
- Agency can create a contract from within the project detail view
- Auto-generate a PDF from the contract form data (Contrat Proforma)
- Contract workflow happens inside the chat system (long-term: after chat is built)
- Contract page has filters: client, date, status (done / resiliation / not completed)
- Only director sees contract notifications
- Resiliation UI available to both parties

---

## Backend Tasks

- [ ] **Add PDF generation for contracts**
  - Install: `npm install pdfkit` (or `puppeteer` for HTML→PDF)
  - File: new `backend/utils/generateContractPdf.js`
  - Takes a contract object, returns a PDF buffer
  - Add: `GET /contracts/:id/pdf` — streams the generated PDF to the client
  - Store the fileId in `contract.contractPdf` after generation

- [ ] **Add date and client filter to GET /contracts**
  - File: `backend/controllers/contractController.js` → `getContracts`
  - Add query params: `fromDate`, `toDate`, `clientId`
  - Filter accordingly before returning

- [ ] **Add Agency ↔ AgencyMember contract party support**
  - File: `backend/models/Contract.js`
  - Add `"AgencyMember"` to `partyBType` enum
  - Allows internal employment contracts between agency and its members

- [ ] **Wire contract notifications** (do after task 08_notifications)
  - On `sendContract`: notify client → "Contrat envoyé, veuillez envoyer un reçu"
  - On `uploadReceipt`: notify agency director → "Reçu reçu, envoyez le bon de commande"
  - On `sendBonDeCommande`: notify both parties → "Contrat signé"
  - Only director receives these (check recipientRole in Notification.notify())

---

## Frontend Tasks

- [ ] **Add "Créer un contrat" button in agency project detail**
  - File: director project detail view
  - Button appears when project has no contract yet (check via `getByProject`)
  - Opens a multi-section form:
    - Contract type selector (Service, Collaboration, CDD, CDI)
    - Objet du contrat, Prestations, Livrables
    - Dispositions financières (amount, currency, payment method, schedule)
    - Durée (start date, end date)
    - Confidentialité, Exclusivité, Résiliation clauses

- [ ] **Add PDF download button to contract detail view**
  - File: contract detail (both client and agency side)
  - Button "Télécharger le contrat PDF"
  - Calls GET /contracts/:id/pdf and opens/downloads the file

- [ ] **Add resiliation initiation UI**
  - File: contract detail view (director and client)
  - Button "Demander la résiliation" (only if status !== resiliation)
  - Prompt for reason text
  - Calls `contractService.resiliate(id, initiatedBy, reason)`

- [ ] **Add date + client filters to contracts list**
  - File: client contracts page + agency contracts page
  - Add filter bar: date range pickers, status filter (Tous / En cours / Signé / Résiliation)
  - Wire to `contractService.getAll()` params

- [ ] **Build agency contracts page (director)**
  - File: new `DirectorContracts.js`
  - List all contracts where partyA = agency
  - Status badges, client name, date
  - Click to open detail + manage workflow (send, upload BDC)
  - Add to AgencyDashboard director navigation
