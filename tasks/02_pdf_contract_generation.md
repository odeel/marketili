# Task 02 — PDF Contract Generation

**Status:** ❌ Not implemented  
**Effort:** Large (server-side PDF rendering, GridFS storage, download endpoint)  
**Depends on:** Task 01 (chat) to send the PDF through chat  

---

## What's Missing

The `Contract` model has a `contractPdf` field (String) that is meant to store a GridFS file ID, but no PDF is ever generated. The spec requires:

- Agency fills out the Contrat Proforma form (Task 03)
- On submit, a PDF is auto-generated server-side
- PDF is stored in GridFS
- PDF is sent through chat (system message with attachment)
- Both parties can download it from the contract detail page

---

## Backend Work

### 1. Install PDF library

```bash
cd backend && npm install pdfkit
```

`pdfkit` is the best fit: pure Node, no headless browser, streams directly into GridFS.

### 2. New utility: `backend/utils/generateContractPdf.js`

```js
const PDFDocument = require("pdfkit");
const { getGFS }  = require("../config/db");
const { ObjectId } = require("mongoose").Types;

async function generateContractPdf(contract) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50 });
    const gfs    = getGFS();
    const fileId = new ObjectId();

    const uploadStream = gfs.openUploadStreamWithId(fileId, `contrat_${contract._id}.pdf`, {
      contentType: "application/pdf",
    });

    doc.pipe(uploadStream);

    // ── Header ──
    doc.fontSize(18).font("Helvetica-Bold").text("CONTRAT DE COLLABORATION", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica").text(`Référence : ${contract._id}`, { align: "center" });
    doc.moveDown(1.5);

    // ── Parties ──
    doc.fontSize(12).font("Helvetica-Bold").text("ENTRE LES PARTIES");
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Partie A : ${contract.partyAName || "—"} (${contract.partyAType})`);
    doc.text(`Partie B : ${contract.partyBName || "—"} (${contract.partyBType})`);
    doc.moveDown(1);

    // ── Sections (PRÉAMBULE → ARTICLE 15) ──
    const sections = contract.sections || {};
    const SECTION_LABELS = [
      ["preambule",   "PRÉAMBULE"],
      ["article1",    "ARTICLE 1 — Objet du contrat"],
      ["article2",    "ARTICLE 2 — Durée"],
      ["article3",    "ARTICLE 3 — Obligations de l'agence"],
      ["article4",    "ARTICLE 4 — Obligations du client"],
      ["article5",    "ARTICLE 5 — Rémunération"],
      ["article6",    "ARTICLE 6 — Conditions de paiement"],
      ["article7",    "ARTICLE 7 — Propriété intellectuelle"],
      ["article8",    "ARTICLE 8 — Confidentialité"],
      ["article9",    "ARTICLE 9 — Résiliation"],
      ["article10",   "ARTICLE 10 — Force majeure"],
      ["article11",   "ARTICLE 11 — Litiges"],
      ["article12",   "ARTICLE 12 — Loi applicable"],
      ["article13",   "ARTICLE 13 — Modifications"],
      ["article14",   "ARTICLE 14 — Intégralité de l'accord"],
      ["article15",   "ARTICLE 15 — Signatures"],
    ];

    for (const [key, title] of SECTION_LABELS) {
      doc.font("Helvetica-Bold").fontSize(10).text(title);
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(9).text(sections[key] || "—");
      doc.moveDown(0.8);
    }

    // ── Signature block ──
    doc.moveDown(1);
    doc.fontSize(9).font("Helvetica").text(
      `Fait à Alger, le ${new Date().toLocaleDateString("fr-DZ")}`,
      { align: "right" }
    );

    doc.end();

    uploadStream.on("finish", () => resolve(fileId.toString()));
    uploadStream.on("error",  reject);
  });
}

module.exports = generateContractPdf;
```

### 3. Update `backend/controllers/contractController.js`

Add a new endpoint `generatePdf`:

```js
const generateContractPdf = require("../utils/generateContractPdf");

exports.generatePdf = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return fail(res, "Contrat introuvable", 404);

    // Authorization: only partyA or partyB can generate
    const userId = req.user._id.toString();
    if (contract.partyAId?.toString() !== userId && contract.partyBId?.toString() !== userId) {
      return fail(res, "Non autorisé", 403);
    }

    const fileId = await generateContractPdf(contract);
    contract.contractPdf = fileId;
    await contract.save();

    // If chat conversation exists, post system message with the PDF link
    if (contract.conversationId) {
      const ChatController = require("./chatController");
      await ChatController.systemMessage(contract.conversationId, {
        body: "Le Contrat Proforma a été généré. Téléchargez-le ci-dessous.",
        attachments: [{ fileId, filename: `contrat_${contract._id}.pdf`,
          mimeType: "application/pdf", url: `/api/upload/${fileId}` }],
      });
    }

    return ok(res, { fileId, url: `/api/upload/${fileId}` });
  } catch (err) {
    console.error("generatePdf:", err);
    return fail(res, "Erreur génération PDF", 500);
  }
};
```

Add route in `backend/routes/contractRoutes.js`:
```js
router.post("/:id/generate-pdf", protect, c.generatePdf);
```

### 4. PDF download

PDFs are stored in GridFS. The existing `/api/upload/:fileId` endpoint already streams GridFS files — no new endpoint needed.

---

## Frontend Work

### 1. New service method in `contractService.js`

```js
generatePdf: (id) => api.post(`/contracts/${id}/generate-pdf`).then(r => r.data),
```

### 2. "Générer le PDF" button in DirectorContracts

In the contract detail view (`DirectorContracts.js`):
- Show button only when `contract.status` is at least `"sent"` AND `contract.sections` are filled
- On click: call `contractService.generatePdf(id)`, show loading, then show download link
- If `contract.contractPdf` already exists, skip generation and show download link directly

```jsx
<button onClick={handleGeneratePdf} disabled={generating}>
  {generating ? "Génération..." : "Générer le PDF"}
</button>
{contract.contractPdf && (
  <a href={`${API_URL}/upload/${contract.contractPdf}`} target="_blank" download>
    Télécharger le contrat PDF
  </a>
)}
```

### 3. Show download link in ClientDashboard contract view

Same logic: if `contract.contractPdf` exists, show download link.

---

## Acceptance Criteria

- [ ] Agency director clicks "Générer le PDF" on a filled contract
- [ ] PDF is created server-side and stored in GridFS
- [ ] Both client and agency can download the PDF via the upload endpoint
- [ ] If chat exists, a system message with the PDF attachment appears in the conversation
- [ ] `contract.contractPdf` is set and persisted in MongoDB
