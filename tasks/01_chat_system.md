# Task 01 — Chat / Conversation System

**Status:** ❌ Not implemented  
**Effort:** Large (new models, routes, real-time or polling UI)  
**Blocks:** Task 02 (PDF sent through chat)

---

## What's Missing

No chat or messaging exists anywhere in the codebase. The Contract model has a `conversationId` ref field that is never populated. The spec requires:

- Parties (client ↔ agency/freelancer) can exchange messages inside a project/contract context
- Agency sends the signed Contrat Proforma PDF through chat
- Client receives it, uploads payment receipt through chat
- System messages appear in chat (e.g. "Bon de commande envoyé")

---

## Backend Work

### 1. New model: `backend/models/Conversation.js`

```js
{
  project:     { type: ObjectId, ref: "Project", required: true },
  participants: [
    {
      participantType: { type: String, enum: ["Client","Agency","Team","Freelancer","AgencyMember"] },
      participantId:   ObjectId,
    }
  ],
  lastMessage:  { type: ObjectId, ref: "Message" },
  createdAt, updatedAt  // timestamps: true
}
```

### 2. New model: `backend/models/Message.js`

```js
{
  conversation: { type: ObjectId, ref: "Conversation", required: true },
  sender: {
    senderType: { type: String, enum: ["Client","Agency","Team","Freelancer","AgencyMember","system"] },
    senderId:   ObjectId,
    senderName: String,
  },
  body:        { type: String, trim: true },          // text content
  attachments: [{ fileId: String, filename: String, mimeType: String, url: String }],
  isSystemMsg: { type: Boolean, default: false },     // auto-generated events
  readBy:      [{ participantId: ObjectId, readAt: Date }],
  createdAt    // timestamps: true
}
```

### 3. New controller: `backend/controllers/chatController.js`

Endpoints:
- `POST /api/chat/conversations` — create or get existing conversation for a project (idempotent)
- `GET  /api/chat/conversations` — list all conversations for current user (by participantId)
- `GET  /api/chat/conversations/:id/messages?page=1&limit=30` — paginated messages (newest first)
- `POST /api/chat/conversations/:id/messages` — send a message (text + optional file attachment)
- `PATCH /api/chat/conversations/:id/read` — mark all as read for current user
- `GET  /api/chat/unread-count` — total unread count across all conversations (used in topbar badge)

On message creation:
- Update `conversation.lastMessage`
- Fire `Notification.notify()` to all other participants (category: "messages", type: "system")

### 4. New route: `backend/routes/chatRoutes.js`

```js
router.use(protect);
router.post("/conversations",            c.getOrCreateConversation);
router.get("/conversations",             c.getMyConversations);
router.get("/conversations/:id/messages",c.getMessages);
router.post("/conversations/:id/messages", upload.single("file"), c.sendMessage);
router.patch("/conversations/:id/read",  c.markRead);
router.get("/unread-count",              c.getUnreadCount);
```

Mount in `server.js`: `app.use("/api/chat", require("./routes/chatRoutes"))`

### 5. Update `Project` model (already has `conversation` ref — populate it on getProject)

### 6. Update `Contract` model: populate `conversationId` when fetching contract detail

---

## Frontend Work

### 1. New service: `frontend/src/services/chatService.js`

```js
const chatService = {
  getOrCreate:    (projectId) => api.post("/chat/conversations", { projectId }),
  getConversations: ()        => api.get("/chat/conversations"),
  getMessages:    (id, page)  => api.get(`/chat/conversations/${id}/messages`, { params: { page } }),
  sendMessage:    (id, data)  => api.post(`/chat/conversations/${id}/messages`, data), // FormData for file
  markRead:       (id)        => api.patch(`/chat/conversations/${id}/read`),
  getUnreadCount: ()          => api.get("/chat/unread-count"),
};
```

### 2. New component: `frontend/src/components/chat/ChatWindow.js`

A self-contained chat UI component that takes `conversationId` as prop:
- Scrollable message list (newest at bottom, load more on scroll up)
- Message bubbles: right = own messages (red), left = other party (grey)
- System messages centered in italic grey
- File attachment display (image preview or file link)
- Input bar: textarea (Enter to send, Shift+Enter for newline) + attach file button
- Polling every 10s for new messages (or use page focus refresh)
- Unread count badge cleared on open

### 3. Wire into Project detail pages

In each project detail view (ClientDashboard, AgencyDashboard DirectorProjects, FreelancerProjects, TeamMemberProjects):
- Add "Messagerie" tab alongside tasks/deliverables tabs
- Tab renders `<ChatWindow conversationId={project.conversation} projectId={project._id} />`
- On first open, auto-create the conversation if none exists

### 4. Wire into Contract detail

In DirectorContracts and ClientDashboard contract views:
- Show chat as a side panel or tab
- System messages auto-generated when contract milestones happen (Bon de Commande sent, receipt uploaded, etc.)

### 5. Update topbar unread badge (already partially wired in DashboardLayout)

`DashboardLayout.js` already polls `chatService.getUnreadCount()` every 30s and shows the ✉ badge — this will work once the endpoint exists.

---

## Key Design Decisions

- **No WebSockets for now** — polling every 10s is sufficient for the use case (B2B, not real-time chat app)
- **One conversation per project** — not per contract (contracts reference the same project conversation)
- **System messages** for milestone events (contract sent, receipt uploaded, etc.) are created by controllers calling a helper `chatController.systemMessage(conversationId, body)`
- **Participants** are determined at project creation time: the client + the provider (agency/team/freelancer); also include agency members who are director/commercial

---

## Acceptance Criteria

- [ ] Client and agency director can exchange messages inside a project
- [ ] File attachments are uploadable and downloadable in chat
- [ ] System message appears when Bon de Commande is sent
- [ ] System message appears when receipt is uploaded
- [ ] Unread badge in topbar shows count
- [ ] Marking chat as read clears the badge
- [ ] Messages are paginated (load older messages on scroll)
