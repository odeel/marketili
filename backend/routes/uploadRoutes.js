// backend/routes/uploadRoutes.js

const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
const { conn, gfs, upload } = require("../config/db");

// POST /api/upload — upload a single file
// Returns: { success, fileId, filename, url, mimeType, size }
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier reçu" });

  res.status(201).json({
    success:  true,
    fileId:   req.file.id.toString(),
    filename: req.file.filename,
    url:      `/api/upload/${req.file.id}`,
    mimeType: req.file.contentType,
    size:     req.file.size,
  });
});

// GET /api/upload/:fileId — stream file (view inline)
router.get("/:fileId", async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "uploads" });
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ success: false, message: "Fichier introuvable" });

    const file = files[0];
    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `inline; filename="${file.filename}"`);
    bucket.openDownloadStream(fileId).pipe(res);

  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur lors du téléchargement" });
  }
});

// GET /api/upload/:fileId/download — force download
router.get("/:fileId/download", async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "uploads" });
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ success: false, message: "Fichier introuvable" });

    const file = files[0];
    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);
    bucket.openDownloadStream(fileId).pipe(res);

  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur lors du téléchargement" });
  }
});

module.exports = router;