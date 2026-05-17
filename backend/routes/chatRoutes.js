const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const { upload }  = require("../config/db");
const ctrl        = require("../controllers/chatController");

// IMPORTANT: specific routes before param routes to avoid Express matching
// "unread-count" or "project" as a :conversationId
router.get("/unread-count",              protect, ctrl.getUnreadCount);
router.get("/project/:projectId",        protect, ctrl.getOrCreateConversation);
router.get("/:conversationId/messages",  protect, ctrl.getMessages);
router.post(
  "/:conversationId/messages",
  protect,
  upload.single("file"),
  ctrl.sendMessage
);
router.patch("/:conversationId/read",    protect, ctrl.markRead);

module.exports = router;
