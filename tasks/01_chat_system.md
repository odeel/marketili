# Task 01 — Chat & Messaging System

**Priority:** 🔴 Critical
**Depends on:** nothing (must be built first)
**Blocks:** Task 02 (contract PDF flow through chat)

---

## Why This Exists

The spec states clearly: "The contract workflow happens INSIDE the chat system. No external workflow."

The entire contract exchange (Proforma PDF → receipt → Bon de Commande) is supposed to flow through an in-platform messaging thread. Currently:
- `Project` model has a `conversationId` field pointing to a `Conversation` model that does not exist
- No `Conversation` model, no `Message` model, no routes, no frontend UI

---

## Scope

A real-time-ready but initially HTTP-polling chat system between two parties per project. No need for WebSockets in v1 — polling every few seconds is acceptable.

Each project has exactly **one conversation thread** between the two parties (client ↔ provider). The contract document exchanges happen inside this thread.

---

## Backend Work

### 1. New Model: `backend/models/Conversation.js`

Fields:
- `project` (ref: Project, required, unique — one conversation per project)
- `participants[]`: `{ participantType: enum["Client","Agency","Freelancer","Team"], participantId }`
- `createdAt`

### 2. New Model: `backend/models/Message.js`

Fields:
- `conversation` (ref: Conversation, required)
- `sender` (no ref, manual)
- `senderRole` enum: "client" | "agency" | "agency_member" | "freelancer" | "team"
- `senderName`
- `senderType` enum: "Client" | "Agency" | "AgencyMember" | "Freelancer" | "Team"
- `messageType` enum: "text" | "file" | "contract_pdf" | "receipt" | "bon_de_commande" | "system"
- `content` (text body, optional)
- `file`: `{ fileId, filename, url, mimeType, size }` (optional, for file messages)
- `isRead` (default false)
- `readAt`
- `metadata`: `{ contractId }` (optional, links file messages to a contract record)
- timestamps

### 3. New Controller: `backend/controllers/chatController.js`

Endpoints:
- `getOrCreateConversation(projectId)` — GET `/chat/project/:projectId` — finds or creates the conversation for a project; returns conversation + participants
- `getMessages(conversationId, page, limit)` — GET `/chat/:conversationId/messages` — paginated, ordered oldest→newest
- `sendMessage(conversationId, content, file?)` — POST `/chat/:conversationId/messages` — supports text or file upload; validates sender is a participant
- `markRead(conversationId)` — PATCH `/chat/:conversationId/read` — marks all unread messages as read for the current user
- `getUnreadCount(userId, userRole)` — GET `/chat/unread-count` — total unread messages across all conversations

### 4. New Routes: `backend/routes/chatRoutes.js`

```
GET    /api/chat/project/:projectId       → getOrCreateConversation
GET    /api/chat/:conversationId/messages → getMessages
POST   /api/chat/:conversationId/messages → sendMessage (with optional file via upload middleware)
PATCH  /api/chat/:conversationId/read     → markRead
GET    /api/chat/unread-count             → getUnreadCount
```

All routes: `protect` middleware required.

### 5. Update `backend/server.js`

Mount: `app.use('/api/chat', chatRoutes)`

Add `/api/chat` to soft-delete protection list.

### 6. Update `backend/models/Project.js`

`conversationId` field already exists. Verify it points to `Conversation` model.

### 7. Update `backend/controllers/projectController.js`

When a project is auto-created (inside `acceptPitch`), also auto-create the Conversation for that project and set `project.conversationId`.

---

## Frontend Work

### 1. New Service: `frontend/src/services/chatService.js`

Methods:
- `getConversation(projectId)` — GET `/chat/project/:projectId`
- `getMessages(conversationId, page)` — GET `/chat/:conversationId/messages`
- `sendMessage(conversationId, { content, file? })` — POST with multipart if file
- `markRead(conversationId)` — PATCH `/chat/:conversationId/read`
- `getUnreadCount()` — GET `/chat/unread-count`

### 2. New Component: `frontend/src/components/chat/ChatWindow.jsx`

UI structure:
- Messages list (scrollable, oldest at top)
- Each message: sender avatar, name, time, content or file pill
- File messages: icon + filename + download link
- System messages (e.g., "Contrat envoyé"): centered, grey, italic
- `contract_pdf` / `receipt` / `bon_de_commande` message types: special card with label + download button
- Input bar: text field + send button + attach file button (opens file picker)
- Polls for new messages every 5 seconds (simple interval, clears on unmount)
- Auto-scrolls to bottom on new message
- Marks conversation as read on open

### 3. New Component: `frontend/src/components/chat/MessageBubble.jsx`

Renders a single message. Variations by `messageType`.

### 4. Integrate ChatWindow into Project Detail

Everywhere a project detail is shown (ClientDashboard projects, DirectorProjects, FreelancerProjects, TeamLeadProjects), add a "Messagerie" tab or panel alongside tasks/deliverables that renders `<ChatWindow projectId={project._id} />`.

### 5. Unread Chat Badge

Add chat unread count to the dashboard topbar (alongside notification bell) — poll `chatService.getUnreadCount()` every 30s.

---

## Files to Create

```
backend/models/Conversation.js          NEW
backend/models/Message.js               NEW
backend/controllers/chatController.js   NEW
backend/routes/chatRoutes.js            NEW
frontend/src/services/chatService.js    NEW
frontend/src/components/chat/ChatWindow.jsx     NEW
frontend/src/components/chat/MessageBubble.jsx  NEW
```

## Files to Modify

```
backend/server.js                           ADD chatRoutes mount
backend/models/Project.js                   VERIFY conversationId ref
backend/controllers/projectController.js    ADD conversation auto-create in acceptPitch
frontend/src/components/layout/DashboardLayout.jsx  ADD chat unread badge
frontend/src/pages/dashboard/ClientDashboard.js     ADD chat tab to project detail
frontend/src/pages/dashboard/agency/DirectorProjects.js  ADD chat tab
frontend/src/pages/dashboard/freelancer/FreelancerProjects.js  ADD chat tab
```

---

## Acceptance Criteria

- [ ] Client opens a project and sees a "Messagerie" tab
- [ ] Client and agency can exchange text messages in real time (via polling)
- [ ] Either party can attach and send a PDF file
- [ ] File messages render as a download card with label
- [ ] System messages (contract milestones) appear automatically in the thread
- [ ] Unread count appears in topbar and clears when conversation is opened
- [ ] Conversation is auto-created when a project is created
