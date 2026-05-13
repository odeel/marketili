// backend/config/db.js
const mongoose = require("mongoose");
const Grid     = require("gridfs-stream");
const { GridFsStorage } = require("multer-gridfs-storage");
const multer   = require("multer");

let _gfs;
let _upload;

// ── Main connection ──
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    _gfs = Grid(conn.connection.db, mongoose.mongo);
    _gfs.collection("uploads");
    console.log("✅ GridFS initialized");

    const storage = new GridFsStorage({
      url: mongoURI,
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      file: (req, file) => {
        const allowed = [
          "image/jpeg", "image/png", "image/webp", "image/gif",
          "video/mp4", "video/quicktime", "video/webm",
        ];
        if (!allowed.includes(file.mimetype)) {
          return new Error("Type de fichier non supporté");
        }
        return {
          bucketName: "uploads",
          filename: `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`,
          metadata: { originalName: file.originalname, uploadedAt: new Date() },
        };
      },
    });

    _upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// ── upload object: .single/.array/.fields defer until request time ──
// Routes use upload.single("file") at definition time — this returns a
// middleware function that only calls the real multer at request time,
// by which point connectDB has finished and _upload is ready.
const upload = {
  single: (field) => (req, res, next) => _upload.single(field)(req, res, next),
  array:  (field, max) => (req, res, next) => _upload.array(field, max)(req, res, next),
  fields: (fields) => (req, res, next) => _upload.fields(fields)(req, res, next),
  none:   () => (req, res, next) => _upload.none()(req, res, next),
};

const getGfs = () => _gfs;

// uploadRoutes.js uses conn.db directly for GridFSBucket
// We expose the mongoose default connection for that
const conn = mongoose.connection;

module.exports = { connectDB, conn, gfs: getGfs, upload };