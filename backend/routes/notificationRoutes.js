// backend/routes/notificationRoutes.js

const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const Notification = require("../models/Notification");

// All notification routes require auth
router.use(protect);

// GET /api/notifications — get my notifications (paginated)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const query = { recipient: req.user._id };
    if (unreadOnly === "true") query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, notifications, total, unreadCount,
      pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications/unread-count — quick badge count
router.get("/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification introuvable" });
    res.json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/mark-all-read — mark all as read
router.patch("/mark-all-read", async (req, res) => {
  try {
    await Notification.markAllRead(req.user._id);
    res.json({ success: true, message: "Toutes les notifications marquées comme lues" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notifications/:id — delete one notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: "Notification supprimée" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;