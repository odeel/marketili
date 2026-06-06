# 📧 Email Verification — Setup Report

Short report of everything wired for email verification, plus the **exact steps you still need to do** in the backend and frontend.

> Status: ✅ Code is fully implemented. ⏳ Only configuration + a small cleanup remain (below).

---

## How it works (1-paragraph recap)

On register, the backend emails the user a link (`FRONTEND_URL/verify-email?token=…`, a signed JWT valid 48h). The user keeps full access immediately (**soft gate**) but sees a yellow "Vérifiez votre adresse email" banner with a **Renvoyer l'email** button until they confirm. Clicking the link opens `/verify-email`, which calls the backend and flips `isVerified` to `true`.

---

## Already implemented (no action needed)

### Backend
- `backend/utils/mailer.js` — Gmail SMTP transport (nodemailer) + branded HTML email template.
- `backend/controllers/authController.js` — sends the email on `register`; adds `verifyEmail` + `resendVerification`; builds the link from `FRONTEND_URL`.
- `backend/routes/authRoutes.js` — `POST /api/auth/verify-email` (public), `POST /api/auth/resend-verification` (protected).
- `nodemailer` dependency installed.
- `isVerified` already existed on all role models.

### Frontend
- `frontend/src/pages/auth/VerifyEmailPage.js` + route `/verify-email` in `App.js`.
- `frontend/src/components/auth/VerifyEmailBanner.js` — mounted in `DashboardLayout`.
- `frontend/src/services/authService.js` — `verifyEmail()` + `resendVerification()`.

---

## Steps to modify — BACKEND

1. **Confirm the email vars in `backend/.env`** (you already added these ✅):
   ```env
   GMAIL_USER=youraddress@gmail.com
   GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx     # 16-char App Password, no spaces
   EMAIL_FROM_NAME=Marketili
   ```
   (Setup details: `backend/GMAIL_SETUP.md`.)

2. **Set `FRONTEND_URL` to the real frontend URL** — the verification link is built from it.
   - Local: `FRONTEND_URL=http://localhost:3000`
   - Production: `FRONTEND_URL=https://YOUR-SITE.netlify.app`
   > If this is wrong/localhost in production, the emailed link won't open the live site.

3. **Restart the backend** so it reads the new `.env`:
   ```bash
   # local
   node server.js
   # production (Droplet)
   pm2 restart marketili-backend && pm2 logs marketili-backend --lines 20
   ```

4. ⚠️ **Fix the Chargily key name (unrelated to email, but it will break payments).**
   Your `backend/.env` has `CHARGILI_SECRET_KEY` / `CHARGILI_PUBLIC_KEY` (with an **I**), but the code reads **`CHARGILY_SECRET_KEY`** (with a **Y**, see `backend/config/chargily.js`). Rename it:
   ```env
   CHARGILY_SECRET_KEY=test_sk_...
   ```

---

## Steps to modify — FRONTEND

1. **Remove the email vars you added to `frontend/.env`** — they are **not used** there (email is sent only by the backend). Delete these lines from `frontend/.env`:
   ```env
   GMAIL_USER=...
   GMAIL_APP_PASSWORD=...
   EMAIL_FROM_NAME=...
   ```
   > Keeping a Gmail App Password in the frontend is also a secret-exposure risk, since frontend env values get bundled into the public build.

2. **Nothing else to add on the frontend.** The verify page, banner, and service calls are already in place.

---

## How to test (2 minutes)

1. Register a new account with a real email you can open.
2. Check the inbox (and Spam) for **"Confirmez votre adresse email — Marketili"**.
3. Click the button → you land on **"Adresse vérifiée !"**.
4. Back in the dashboard, the yellow verify banner is gone.

> **No email arriving?** Check the server logs:
> - `Email non configuré …` → `GMAIL_USER`/`GMAIL_APP_PASSWORD` missing in **backend** `.env`.
> - `Invalid login: 535 …` → wrong password (must be a Gmail **App Password**, not your normal password).
> - Link opens the wrong site → fix `FRONTEND_URL` (step B-2).

---

*Report date: 2026-06-06*
