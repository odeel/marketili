const express = require("express");
const router  = express.Router();
const c       = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

// ── Users ──
router.get("/users",                    c.getAllUsers);
router.patch("/users/:role/:id/toggle", c.toggleUserStatus);

// ── Stats ──
router.get("/stats",    c.getStats);

// ── Activity ──
router.get("/activity", c.getRecentActivity);

// ── Posts moderation ──
router.get("/posts",              c.getAdminPosts);
router.patch("/posts/:id/remove", c.removePost);

// ── Options ──
router.get("/options",                     c.getAllOptions);
router.get("/options/:key",                c.getOptions);
router.post("/options/:key/add",           c.addOptionValue);
router.delete("/options/:key/:value",      c.deleteOptionValue);

module.exports = router;
