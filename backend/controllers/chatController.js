const Conversation = require("../models/Conversation");
const Message      = require("../models/Message");
const Project      = require("../models/Project");
const AgencyMember = require("../models/AgencyMember");

const ROLE_TO_TYPE = {
  client:        "Client",
  agency:        "Agency",
  agency_member: "AgencyMember",
  team:          "Team",
  team_member:   "TeamMember",
  freelancer:    "Freelancer",
};

const getSenderName = (user) =>
  user.firstName
    ? `${user.firstName} ${user.lastName}`
    : user.agencyName || user.teamName || user.companyName || "Utilisateur";

// ─────────────────────────────────────────────
// GET OR CREATE CONVERSATION  GET /api/chat/project/:projectId
// ─────────────────────────────────────────────
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Projet introuvable" });
    }

    let conv = await Conversation.findOne({ project: projectId });

    if (!conv) {
      const participants = [];

      if (project.client) {
        participants.push({ participantType: "Client", participantId: project.client });
      }
      if (project.providerAgency) {
        participants.push({ participantType: "Agency", participantId: project.providerAgency });
      } else if (project.providerTeam) {
        participants.push({ participantType: "Team", participantId: project.providerTeam });
      } else if (project.providerFreelancer) {
        participants.push({ participantType: "Freelancer", participantId: project.providerFreelancer });
      }

      conv = await Conversation.create({ project: projectId, participants });

      // Back-fill conversationId on the project
      await Project.findByIdAndUpdate(projectId, { conversationId: conv._id });
    }

    res.json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET MESSAGES  GET /api/chat/:conversationId/messages
// ─────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    res.json({
      success: true,
      messages,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// SEND MESSAGE  POST /api/chat/:conversationId/messages
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType, metadata } = req.body;

    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      return res.status(404).json({ success: false, message: "Conversation introuvable" });
    }

    const user     = req.user;
    const userRole = req.userRole;

    const msgData = {
      conversation: conversationId,
      sender:       user._id,
      senderRole:   userRole,
      senderName:   getSenderName(user),
      senderType:   ROLE_TO_TYPE[userRole] || "Client",
      messageType:  messageType || "text",
      isRead:       false,
    };

    if (content)  msgData.content  = content;
    if (metadata) msgData.metadata = metadata;

    if (req.file) {
      const fileId =
        (req.file.id || req.file.fileId || req.file.filename)?.toString?.() ||
        String(req.file.filename || Date.now());

      msgData.messageType = msgData.messageType === "text" ? "file" : msgData.messageType;
      msgData.file = {
        fileId,
        filename: req.file.filename || req.file.originalname || "fichier",
        url:      `/api/upload/${fileId}`,
        mimeType: req.file.contentType || req.file.mimetype || "application/octet-stream",
        size:     req.file.size || 0,
      };
    }

    if (!msgData.content && !msgData.file) {
      return res.status(400).json({ success: false, message: "Contenu ou fichier requis" });
    }

    const message = await Message.create(msgData);
    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// MARK READ  PATCH /api/chat/:conversationId/read
// ─────────────────────────────────────────────
exports.markRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET UNREAD COUNT  GET /api/chat/unread-count
// ─────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const userId   = req.user._id;
    const userRole = req.userRole;

    // Build project filter based on role
    let projectFilter = {};
    if (userRole === "client")      projectFilter.client           = userId;
    else if (userRole === "agency") projectFilter.providerAgency   = userId;
    else if (userRole === "team")   projectFilter.providerTeam     = userId;
    else if (userRole === "freelancer") projectFilter.providerFreelancer = userId;
    else if (userRole === "agency_member") {
      const member = await AgencyMember.findById(userId).select("agency");
      if (member) projectFilter.providerAgency = member.agency;
    }

    const projects = await Project.find(projectFilter).select("_id");
    const projectIds = projects.map(p => p._id);

    const convs = await Conversation.find({ project: { $in: projectIds } }).select("_id");
    const convIds = convs.map(c => c._id);

    const count = await Message.countDocuments({
      conversation: { $in: convIds },
      sender:       { $ne: userId },
      isRead:       false,
    });

    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
