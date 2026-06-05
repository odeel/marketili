# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Marketili** is a fullstack marketplace platform (MERN stack) connecting clients with agencies, teams, and freelancers for marketing projects. Clients post needs, providers pitch on them, accepted pitches auto-create projects with tasks and contracts. The platform is monetized via per-role **paid subscriptions** (Chargily Pay V2, monthly, no free trial) and shows admin-managed **ads**. New accounts get an **email-verification** flow (Gmail SMTP).

## Development Commands

### Backend
```bash
cd backend
npm install
node server.js          # Start API server on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm start               # Dev server on http://localhost:3000
npm run build           # Production build (CI=false so lint warnings don't fail it)
npm test                # Jest test runner
```

### Environment Setup
Backend reads `backend/.env` (see `backend/.env.example` for the full list). Key variables:
- `PORT` — backend port (default 5000)
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` / `JWT_EXPIRES_IN` — JWT signing + expiry (e.g. `7d`)
- `NODE_ENV` — `development` or `production`
- `CORS_ORIGIN` — allowed frontend origin(s) in production
- `FRONTEND_URL` — used to build payment-return URLs **and** the email-verification link
- `BACKEND_PUBLIC_URL` — public URL for the Chargily webhook
- **Chargily:** `CHARGILY_MODE` (`test`/`live`), `CHARGILY_SECRET_KEY`, optional `CHARGILY_WEBHOOK_SECRET`
- **Email (Gmail SMTP):** `GMAIL_USER`, `GMAIL_APP_PASSWORD` (16-char App Password), `EMAIL_FROM_NAME` — see `backend/GMAIL_SETUP.md`. If unset, verification emails are skipped (logged, not sent).

Frontend uses `REACT_APP_API_URL`. In production it's set to the same-origin `/api` (Netlify proxies `/api/*` and `/socket.io/*` to the backend — see `frontend/netlify.toml`). For local dev use `http://localhost:5000/api` (or the CRA proxy in `frontend/package.json`).

## Architecture

### Monorepo Layout
```
marketili/
├── backend/            # Express.js API
│   ├── config/         # db.js (MongoDB + GridFS), chargily.js, plans.js
│   ├── controllers/    # Business logic (~18 files)
│   ├── middleware/      # auth.js (JWT cookie), subscriptionGate.js
│   ├── models/         # ~21 Mongoose schemas
│   ├── routes/         # ~20 API route files
│   ├── services/       # subscriptionService.js
│   ├── utils/          # mailer.js, logActivity.js, …
│   └── server.js       # Entry point, route mounting, Socket.io
└── frontend/           # React SPA (Create React App)
    └── src/
        ├── App.js          # Router & role-based route protection
        ├── hooks/          # useAuth (singleton), usePosts, usePitches, useSubscription, useFileBlob
        ├── pages/          # Route-level components by role
        ├── services/       # Axios API clients
        └── components/     # Reusable UI components
```

### API Routes (mounted in `server.js`)
```
/api/auth                  Register, login, logout, /me, verify-email, resend-verification
/api/posts                 Client marketing needs (CRUD, media via GridFS)
/api/pitches               Provider bids on posts (CRUD)
/api/projects              Projects + nested tasks (CRUD)
/api/contracts             Formalized agreements
/api/agency-members        Agency staff + attached freelancers
/api/team-members          Team staff management
/api/admin                 Admin operations (users, stats, options, ads, activity log)
/api/upload                File uploads via GridFS
/api/notifications         User notifications
/api/profile               Public profiles + provider browse/search
/api/freelancer            Freelancer-specific endpoints
/api/notes                 Personal notes
/api/calendar              Calendar events
/api/chat                  Direct + project conversations (Socket.io realtime)
/api/collaboration-requests  Provider↔agency collaboration requests
/api/analytics             Dashboard analytics
/api/ads                   Public ad serving (admin CRUD under /api/admin/ads)
/api/activity              Per-user activity feed
/api/subscriptions         Plans, checkout, verify, cancel, webhook, admin overview
/api/health                Health check
```

### Data Flow
1. Client creates a **Post** (marketing need; supports image/video media)
2. Agency/Freelancer submits a **Pitch** on the post
3. Client accepts a pitch → **Project** auto-created with tasks
4. Parties formalize with a **Contract**

### User Roles
- `admin` — full system access (own dashboard at `/admin`, handles its own auth)
- `client` — creates posts, reviews pitches, manages projects
- `agency` / `agency_member` — browse posts, submit pitches, manage team + attached freelancers
- `team` / `team_member` — team collaboration dashboards
- `freelancer` — browse posts, pitch, manage collaborations

### Authentication & Email Verification
- JWT stored in HTTP-only cookies (set on login/register, cleared on logout)
- `middleware/auth.js` verifies the cookie and populates `req.user` and `req.userRole`
- Frontend `useAuth()` hook uses a module-level singleton + React listeners (no Context provider)
- Axios base instance in `services/api.js` uses `withCredentials: true`, redirects 401→`/login` and 402 `SUBSCRIPTION_REQUIRED`→`/billing`
- `PrivateRoute` in `App.js` guards routes by role
- **Email verification:** on register a signed-JWT link is emailed (`utils/mailer.js`, branded template). Access is **not** blocked (soft gate) — a `VerifyEmailBanner` nudges until `isVerified` flips via `POST /api/auth/verify-email`. The `/verify-email` page handles the link.

### Subscriptions (Chargily Pay V2)
- Per-role **monthly** plans in `backend/config/plans.js` (single source of truth): Client 5000, Freelancer 20000, Team 20000, Agency 40000 DZD. **No free trial.**
- `middleware/subscriptionGate.js` returns 402 `SUBSCRIPTION_REQUIRED` on gated value actions (e.g. create post, send pitch) for unpaid billed roles.
- `services/subscriptionService.js` manages periods (no native recurring billing). Frontend: `PricingPage`, `BillingPage`, `useSubscription`, `SubscriptionBanner`.

### File Uploads
- Multer (memory) + GridFS (stored in MongoDB, not disk), images/videos/PDFs up to 50MB
- Upload via `POST /api/upload` (returns `{ fileId, url, filename, mimeType, size }`); retrieve via GridFS stream at `GET /api/upload/:id` (public)
- Frontend: `services/uploadService.js` (`upload`, `resolveUrl`, `fetchBlob`) and `hooks/useFileBlob.js` for authenticated blob rendering. **Always render stored images via `uploadService.resolveUrl(url)`** (or `useFileBlob`) — never a raw relative `src`.

### Frontend Stack
- React 19.2 with Create React App (no TypeScript)
- Material-UI (MUI) v7.3 + `@emotion/styled`; most dashboard UI uses inline styles + plain CSS (`styles/`)
- Framer Motion for animations
- Axios for all API calls; Socket.io client for chat/notifications
- Brand: accent `#c0152a`, dark `#0d0b14` / `#1a0a0a`, "Market**ili**" wordmark

## Notes / Known Issues
- See `ISSUES_REPORT.md` for the current list of verified bugs/enhancements pending fixes.
- The Google OAuth `CLIENT_ID` in `frontend/.env` is for a deferred "Sign in with Google" feature and is currently unused (it does **not** send email).
