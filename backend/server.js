require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const express  = require("express");
const cors     = require("cors");
const { connectDB } = require("./config/db");

connectDB();

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/posts",         require("./routes/postRoutes"));
app.use("/api/upload",        require("./routes/uploadRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ── Health check ──
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Marketili API is running", timestamp: new Date().toISOString() });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} introuvable` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Erreur serveur interne",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Marketili server running on port ${PORT} (${process.env.NODE_ENV})`);
});