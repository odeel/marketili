// backend/routes/projectRoutes.js

const express = require("express");
const router  = express.Router();
const c       = require("../controllers/projectController");
const { protect } = require("../middleware/auth");

// ── Specific routes first (before /:projectId) ──
router.get("/agency/:agencyId/members",            protect, c.getAgencyMembers);
router.get("/agency/:agencyId/flagged-posts",      protect, c.getFlaggedPosts);
router.patch("/agency/:agencyId/flagged-posts/:postId/pitched", protect, c.markFlaggedAsPitched);
router.post("/flag-post",                          protect, c.flagPost);
router.get("/member/:memberId/tasks",              protect, c.getMemberTasks);
router.get("/client/:clientId",                    protect, c.getClientProjects); // ✅ NEW

// ── Generic routes after ──
router.get("/agency/:agencyId",                    protect, c.getAgencyProjects);
router.post("/",                                   protect, c.createProject);
router.get("/:projectId",                          protect, c.getProject);
router.post("/:projectId/assign",                  protect, c.assignMember);
router.post("/:projectId/tasks",                   protect, c.createTask);
router.patch("/:projectId/tasks/:taskId",          protect, c.updateTaskStatus);

module.exports = router;