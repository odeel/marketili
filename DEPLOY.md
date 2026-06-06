# Marketili — Digital Ocean + Netlify Deployment Guide

Full step-by-step guide to host the **backend on a DigitalOcean Droplet** and the **frontend on Netlify**.

> **How the stack fits together (read this first).** The React frontend is static files (HTML/JS/CSS) — Netlify builds and serves them over HTTPS for free, on a global CDN. The Node/Express backend is a long-running process that needs a real server, so it lives on a DigitalOcean Droplet (a small Linux VM). On that VM:
> - **PM2** keeps `server.js` alive (restarts on crash/reboot).
> - **Nginx** sits in front of Node as a *reverse proxy* — it owns ports 80/443, terminates HTTPS, and forwards requests to Node on port 5000.
> - **MongoDB Atlas** is the database (managed, off-server).
>
> The browser only ever talks HTTPS to the Netlify domain; Netlify proxies `/api/*` to the backend. This avoids "mixed content" (HTTPS page calling an HTTP API), which browsers block. Each section below explains *why* its commands are written the way they are.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create the Droplet on DigitalOcean](#2-create-the-droplet-on-digitalocean)
3. [Connect to Your Droplet](#3-connect-to-your-droplet)
4. [Install Server Dependencies](#4-install-server-dependencies)
5. [Give the Server Access to Your Private GitHub Repo](#5-give-the-server-access-to-your-private-github-repo)
6. [Clone the Repo & Checkout Branch](#6-clone-the-repo--checkout-branch)
7. [Configure the Backend `.env`](#7-configure-the-backend-env)
8. [Install & Start the Backend with PM2](#8-install--start-the-backend-with-pm2)
9. [Configure Nginx as Reverse Proxy](#9-configure-nginx-as-reverse-proxy)
10. [Free HTTPS with Let's Encrypt (Certbot)](#10-free-https-with-lets-encrypt-certbot)
11. [Deploy Frontend to Netlify](#11-deploy-frontend-to-netlify)
12. [Update Backend CORS for Netlify URL](#12-update-backend-cors-for-netlify-url)
13. [Updating the App After Changes](#13-updating-the-app-after-changes)
14. [Useful PM2 Commands](#14-useful-pm2-commands)

---

## 1. Prerequisites

Before you start, make sure you have:

- A [DigitalOcean account](https://cloud.digitalocean.com)
- A [Netlify account](https://app.netlify.com)
- A [GitHub account](https://github.com) with access to `https://github.com/odeel/try1.git`
- Your local SSH **public** key (the one you'll add to DigitalOcean):
  ```
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKfXqCuUMyfiATtURlJ9o6MtEnS3GS2pbjAslY/5vnR2 admin@DESKTOP-RCTGCJ2
  ```
- Optional: a domain name pointing to your Droplet IP (needed for HTTPS)

> **Why an SSH key (not a password)?** DigitalOcean adds your *public* key to the Droplet so only the matching *private* key on your machine can log in. It's both safer (no brute-forceable password) and lets you connect without typing one each time.

---

## 2. Create the Droplet on DigitalOcean

1. Log in to [DigitalOcean](https://cloud.digitalocean.com)
2. Click **Create → Droplets**
3. Choose:
   - **Region**: closest to your users (e.g. Frankfurt or Amsterdam for DZ)
   - **OS**: Ubuntu 24.04 LTS
   - **Plan**: Basic → $6/month (1 vCPU, 1 GB RAM) — enough for Marketili
4. Under **Authentication** → **SSH Key** → click **Add SSH Key**
   - Paste your public key:
     ```
     ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKfXqCuUMyfiATtURlJ9o6MtEnS3GS2pbjAslY/5vnR2 admin@DESKTOP-RCTGCJ2
     ```
   - Name it `yacine-local`
5. Click **Create Droplet**
6. Wait ~1 minute, then **copy the Droplet's public IP** (you'll use it everywhere below)

> **Why these choices?** *Region closest to users* = lower latency. *Ubuntu LTS* = "Long-Term Support", patched for ~5 years, so you're not forced to re-deploy on a new OS soon. *1 GB RAM* comfortably runs Node + Nginx for a small app; you can resize the Droplet later without rebuilding it.

> Replace `157.245.255.43` with the actual IP in every command below.

---

## 3. Connect to Your Droplet

From your local machine (PowerShell or terminal):

```bash
ssh root@157.245.255.43
```

If it asks to verify fingerprint, type `yes`.

> **Why:** `ssh <user>@<ip>` opens an encrypted remote shell. `root` is the admin account DigitalOcean creates by default. The first-time *fingerprint* prompt is SSH asking you to confirm you're really talking to this server (it remembers it afterwards in `~/.ssh/known_hosts`, so it only asks once).

---

## 4. Install Server Dependencies

Run these commands **on the Droplet** (one block at a time).

> **Why "one block at a time"?** If a step fails (e.g. no network), you want to see *which* one before moving on — bundling everything hides the error.

### 4a. Update system packages

```bash
apt update && apt upgrade -y
```

> **Why:** `apt update` refreshes the local catalog of *available* package versions (it doesn't install anything). `apt upgrade -y` then installs the newest security/bug-fix versions of what's already on the box. `-y` auto-answers "yes" so it runs unattended; `&&` means "only run upgrade if update succeeded."

### 4b. Install Node.js 22 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v    # should print v22.x.x
npm -v     # should print 10.x.x
```

> **Why this and not plain `apt install nodejs`?** Ubuntu's built-in repo ships an old Node. The NodeSource script adds their package source pinned to the **Node 22 LTS** line, so the next `apt install` pulls a current build (npm included). The `curl` flags: `-f` fail on HTTP errors, `-s` silent progress, `-S` still show real errors, `-L` follow redirects; `| bash -` runs the downloaded script. The `node -v` / `npm -v` lines just confirm it worked.

### 4c. Install PM2 (process manager)

```bash
npm install -g pm2
```

> **Why:** Running `node server.js` directly dies the moment you close SSH or the app crashes. PM2 supervises it — auto-restart on crash, restart on reboot, log management. `-g` installs it **globally** so the `pm2` command exists system-wide, not just inside one project folder.

### 4d. Install Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

> **Why:** Nginx is the public-facing web server / reverse proxy (see §9). `systemctl enable` registers it to launch automatically on every boot; `systemctl start` launches it right now (enable alone doesn't start it immediately).

### 4e. Install Git

```bash
apt install -y git
```

> **Why:** Git is how the server pulls your code from GitHub (clone now, `git pull` for every future update).

---

## 5. Give the Server Access to Your Private GitHub Repo

Because the repo is private, the Droplet needs its own SSH key registered as a **Deploy Key** on GitHub.

> **Why a separate "deploy key" instead of your personal login?** It scopes access to *this one repo*, is read-only, and can be revoked without touching your account. The server authenticates as itself, not as you.

### 5a. Generate an SSH key on the Droplet

```bash
ssh-keygen -t ed25519 -C "marketili-droplet" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

> **Why these flags?** `-t ed25519` picks a modern key type (short, fast, secure). `-C "marketili-droplet"` is just a human-readable label baked into the key. `-f ~/.ssh/github_deploy` writes to a *dedicated* filename so it won't clobber any existing default key. `-N ""` sets an **empty passphrase** — required so automated `git pull`s don't hang waiting for someone to type a password. `cat ...pub` prints the **public** half (the only part you ever share) to paste into GitHub.

**Copy the output** — it looks like:
```
ssh-ed25519 AAAA... marketili-droplet
```

### 5b. Add it to GitHub as a Deploy Key

1. Go to `https://github.com/odeel/try1/settings/keys`
2. Click **Add deploy key**
3. Title: `DigitalOcean Droplet`
4. Key: paste the output from step 5a
5. Check **Allow write access** → NO (read only is fine)
6. Click **Add key**

> **Why read-only?** The server only needs to *download* code, never push. Least privilege = if the key ever leaked, no one could overwrite your repo with it.

### 5c. Configure SSH on the Droplet to use that key for GitHub

```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF
```

> **Why:** This tells SSH "whenever you connect to `github.com`, log in as `git` using *this specific* deploy key." Without it, SSH would offer your default keys and GitHub would reject them. `IdentitiesOnly yes` stops SSH from trying other keys first (which can trip GitHub's "too many auth attempts" limit).
>
> **How it's written:** `cat >> file << 'EOF' … EOF` is a *here-document* — everything between the two `EOF` markers is appended (`>>`) to `~/.ssh/config`. Quoting the first `'EOF'` keeps the text literal (so `$` etc. aren't expanded by the shell).

### 5d. Test the connection

```bash
ssh -T git@github.com
# Expected: Hi odeel! You've successfully authenticated...
```

> **Why:** `-T` disables a pseudo-terminal — GitHub never gives you a shell, so this is purely a "does my key authenticate?" check. Seeing the greeting means §6 will work.

---

## 6. Clone the Repo & Checkout Branch

```bash
cd /var/www
git clone git@github.com:odeel/try1.git marketili
cd marketili
git checkout yacine-fixes
git pull origin yacine-fixes
```

> **Why:** `/var/www` is the conventional home for web app code on Linux. `git clone …  marketili` downloads the repo into a folder named `marketili` (using the SSH URL so it uses the deploy key). `git checkout yacine-fixes` switches to the branch you deploy from; `git pull` makes sure it's the very latest commit on that branch.

Verify the structure:

```bash
ls
# should show: backend  frontend  ...
```

---

## 7. Configure the Backend `.env`

```bash
nano /var/www/marketili/backend/.env
```

> **Why a `.env` file?** It keeps secrets (DB password, JWT secret) and per-environment settings **out of the code/Git**. The backend reads these at startup via `process.env.*`. `nano` is a simple terminal text editor.

Paste exactly this content (edit the values marked with `# CHANGE THIS`):

```env
PORT=5000
MONGO_URI=mongodb://liloshoppingdz_db_user:wBwU6hnnNALyyV10@ac-i991urm-shard-00-00.aerj4xb.mongodb.net:27017,ac-i991urm-shard-00-01.aerj4xb.mongodb.net:27017,ac-i991urm-shard-00-02.aerj4xb.mongodb.net:27017/?ssl=true&replicaSet=atlas-12kle9-shard-0&authSource=admin&appName=marketili-db
JWT_SECRET=marketili_secret_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://YOUR-NETLIFY-SITE.netlify.app
```

> **What each key does:**
> - `PORT=5000` — the local port Node listens on (Nginx forwards to it; it's not public).
> - `MONGO_URI` — full Atlas connection string (all replica-set hosts + `ssl=true`).
> - `JWT_SECRET` — signs/verifies auth tokens; anyone who knows it can forge logins, so keep it secret and long.
> - `JWT_EXPIRES_IN=7d` — how long a login stays valid.
> - `NODE_ENV=production` — flips the app to production behavior: cookies become `secure`+`SameSite=None` (HTTPS-only), verbose dev logging off, etc.
> - `CORS_ORIGIN` — the **only** website allowed to call this API from a browser (set to your Netlify URL in §12).

> **Important:**
> - Replace `https://YOUR-NETLIFY-SITE.netlify.app` with your actual Netlify URL after step 11
> - Consider changing `JWT_SECRET` to a long random string for production:
>   ```bash
>   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
>   ```
>   > **Why:** the default `marketili_secret_key_2024` is guessable. This one-liner prints 64 random bytes as hex — an unguessable secret. Paste it as the new `JWT_SECRET`.
> - For email verification + Chargily payments to work in production, also add the `GMAIL_USER` / `GMAIL_APP_PASSWORD`, `CHARGILY_*`, `FRONTEND_URL`, and `BACKEND_PUBLIC_URL` values (see `backend/.env.example` and `backend/GMAIL_SETUP.md`).

Save and exit: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 8. Install & Start the Backend with PM2

```bash
cd /var/www/marketili/backend
npm install --omit=dev
pm2 start server.js --name marketili-backend
pm2 save
pm2 startup
```

> **Why each line:**
> - `npm install --omit=dev` — installs only runtime dependencies, **skipping devDependencies** (test runners, build tools) that a production server doesn't need → faster install, smaller footprint, less attack surface.
> - `pm2 start server.js --name marketili-backend` — launches the app under PM2 and gives it a name so you can manage it later (`pm2 restart marketili-backend`).
> - `pm2 save` — snapshots the current process list so PM2 knows what to bring back.
> - `pm2 startup` — generates a systemd service so PM2 (and therefore your app) **auto-starts after a reboot**.

The `pm2 startup` command will print a command to run — **copy and run it**. It looks like:

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

> **Why you must run that printed line:** `pm2 startup` only *prints* the exact root-level command needed to register the boot service; it doesn't run it for you (it needs elevated paths). Running it finalizes auto-start.

Verify the backend is running:

```bash
pm2 status
# marketili-backend should show "online"

curl http://localhost:5000/api/health
# {"success":true,"message":"Marketili API is running",...}
```

> **Why `localhost:5000`?** This tests Node *directly on the server*, bypassing Nginx — so if it works here but not from the browser, you know the problem is in Nginx/Netlify, not the app.

---

## 9. Configure Nginx as Reverse Proxy

This makes port 80 (and later 443) forward to your Node.js backend on port 5000.
It also handles WebSocket upgrades for Socket.io.

> **Why a reverse proxy at all?** Node shouldn't be exposed to the internet directly. Nginx handles the public ports, TLS/HTTPS, large-upload limits, timeouts, and can serve many apps — then quietly hands each request to the right local Node process. The browser only ever sees Nginx.

### 9a. Create the Nginx site config

```bash
nano /etc/nginx/sites-available/marketili
```

Paste this (replace `157.245.255.43` with your actual IP, or your domain if you have one):

```nginx
server {
    listen 80;
    server_name 157.245.255.43;

    # Max upload size (matches Multer's 50MB limit)
    client_max_body_size 55M;

    # API + Socket.io
    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;

        # Required for Socket.io WebSocket upgrade
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

> **What every line is for:**
> - `listen 80` — accept plain HTTP (Certbot adds the `443`/HTTPS block in §10).
> - `server_name` — which host/IP this config answers for.
> - `client_max_body_size 55M` — Nginx rejects bodies over **1 MB by default** with `413 Request Entity Too Large`. The app allows 50 MB uploads, so we raise the cap (a little above 50 for overhead).
> - `proxy_pass http://localhost:5000` — forward the request to Node.
> - `proxy_http_version 1.1` — HTTP/1.1 is required for keep-alive and for the WebSocket `Upgrade` handshake.
> - `Upgrade` / `Connection "upgrade"` — these two headers are what turn a normal request into a **WebSocket** connection; without them Socket.io silently falls back/fails.
> - `Host` / `X-Real-IP` / `X-Forwarded-For` / `X-Forwarded-Proto` — because Node now sits *behind* a proxy, it would otherwise see every request as coming from `localhost` over `http`. These headers pass the **real** client host, IP, and original scheme (https) through so the app logs/cookies/redirects behave correctly.
> - `proxy_read_timeout` / `proxy_send_timeout 86400s` — keep idle connections open for ~24h so long-lived Socket.io sockets aren't cut off after the default 60s.

Save and exit: `Ctrl+O` → `Enter` → `Ctrl+X`

### 9b. Enable the site and reload Nginx

```bash
ln -s /etc/nginx/sites-available/marketili /etc/nginx/sites-enabled/
nginx -t
# must print: syntax is ok / test is successful
systemctl reload nginx
```

> **Why each step:** Nginx only loads configs found in `sites-enabled/`. The convention is to *write* configs in `sites-available/` and **symlink** (`ln -s`) the ones you want active into `sites-enabled/` — so you can enable/disable a site by adding/removing one link. `nginx -t` validates the config **before** applying it, so a typo can't crash the live server. `reload` re-reads the config **without dropping connections** (gentler than `restart`).

### 9c. Open the firewall ports

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

> **Why, and the order matters:** `ufw` (the firewall) denies everything not explicitly allowed once enabled. `allow OpenSSH` keeps your SSH access (port 22) — **do this first or you can lock yourself out**. `'Nginx Full'` opens ports **80 + 443** (HTTP + HTTPS). `enable` turns the firewall on; `status` confirms the rules.

### 9d. Test

Open in your browser: `http://157.245.255.43/api/health`

You should see:
```json
{"success":true,"message":"Marketili API is running"}
```

> **Why this URL:** hitting the IP (not `localhost`) goes through Nginx → Node, proving the *whole public path* works end to end.

---

## 10. Free HTTPS with Let's Encrypt (Certbot)

> Skip this section if you don't have a domain name yet. Come back to it once you point a domain to the Droplet IP.

> **Why HTTPS / why a domain is required:** browsers need a TLS certificate to show the padlock and to allow secure cookies. Let's Encrypt issues certificates **only for domain names**, not bare IPs — so HTTPS on the backend needs a domain pointed at the Droplet. (Until then, the Netlify proxy in §11 gives the *frontend* HTTPS, which is enough to launch.)

### 10a. Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

> **Why the second package:** `python3-certbot-nginx` is the Nginx *plugin* — it lets Certbot edit your Nginx config automatically instead of you doing it by hand.

### 10b. Get the certificate

Replace `api.yourdomain.com` with the subdomain you pointed to the Droplet:

```bash
certbot --nginx -d api.yourdomain.com
```

Follow the prompts. Certbot will automatically update your Nginx config for HTTPS.

> **Why:** `--nginx` tells Certbot to verify domain ownership through Nginx, obtain the cert, and rewrite the config to listen on 443 + redirect HTTP→HTTPS. `-d` is the domain the cert is for.

### 10c. Auto-renew (already enabled, just verify)

```bash
certbot renew --dry-run
```

> **Why:** Let's Encrypt certs expire every 90 days. Certbot installs a timer that renews them automatically; `--dry-run` simulates a renewal to confirm that automation works — so it won't silently expire on you.

---

## 11. Deploy Frontend to Netlify

The frontend is a React app (Create React App). Netlify builds and hosts it for free.

> **Why Netlify for the frontend:** a built React app is just static files. Netlify rebuilds them automatically on every Git push, serves them over HTTPS on a CDN, and (via `netlify.toml`) proxies API calls to your backend — no server to manage.

### 11a. Push your latest changes to GitHub

From your **local machine**:

```bash
git add .
git commit -m "ready for deploy"
git push origin yacine-fixes
```

> **Why:** Netlify deploys *from GitHub*, so your latest code has to be pushed first. `add` stages changes, `commit` records them, `push` uploads the branch.

### 11b. Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **Add new site → Import an existing project**
3. Choose **GitHub** → authorize Netlify
4. Search for `try1` → select it
5. Configure the build:

| Setting | Value |
|---|---|
| **Branch to deploy** | `yacine-fixes` |
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `frontend/build` |

> **Why these settings:** the React app lives in the `frontend/` subfolder (**base directory**), so Netlify runs the build there. `npm run build` compiles React into optimized static files. Create React App outputs them to `build/`, which is what Netlify uploads (**publish directory**). **Branch** must match the branch you push to.

### 11c. Set the environment variable in Netlify

In Netlify: **Site Settings → Environment variables → Add variable**

| Key | Value |
|---|---|
| `REACT_APP_API_URL` | `/api` |

> **Important:** use the **relative** value `/api` — NOT `http://157.245.255.43/api`.
> The Netlify site is served over HTTPS, but the backend is HTTP-only. Pointing
> the browser directly at `http://157.245.255.43` is **mixed content**, which
> browsers block (images/PDFs fail to load, and the `secure` auth cookie can't
> be stored). Instead, `frontend/netlify.toml` proxies `/api/*` and
> `/socket.io/*` to the backend server-side, so the browser only ever makes
> same-origin HTTPS requests to the Netlify domain.

> The local `frontend/.env` only contains `PORT=3000` — the API URL **must** be set here in Netlify. Do not add it to `frontend/.env` or local login will break.

> **Why mixed content matters:** The production backend sets cookies with `secure: true` + `SameSite=None` (HTTPS-only). Routing through the Netlify HTTPS proxy lets those cookies be stored as first-party. Local dev uses `localhost:5000` where cookies are `secure: false`, which is why they work there.

> If you later add real HTTPS to the backend (step 10, requires a domain), you can either keep the proxy or set this value to `https://api.yourdomain.com/api` and remove the proxy rewrites from `netlify.toml`.

### 11d. Deploy

Click **Deploy site**. Wait ~2 minutes for the build to complete.

Copy your Netlify URL — it looks like `https://amazing-name-123456.netlify.app`

---

## 12. Update Backend CORS for Netlify URL

Back on your **Droplet**, update the `.env` with the real Netlify URL:

```bash
nano /var/www/marketili/backend/.env
```

Change:
```env
CORS_ORIGIN=https://amazing-name-123456.netlify.app
```

> **Why:** CORS (Cross-Origin Resource Sharing) is a browser security rule. The API rejects browser calls from any origin not listed in `CORS_ORIGIN`. Until you set it to the exact Netlify URL (no trailing slash), the frontend's requests get blocked. You only know the real URL *after* the Netlify deploy, which is why this is a separate step.

Save, then restart the backend:

```bash
pm2 restart marketili-backend
pm2 logs marketili-backend --lines 20
# Check for "MongoDB connected" and no errors
```

> **Why restart:** the app reads `.env` **once at startup**, so config changes don't take effect until the process restarts. `pm2 logs` then lets you confirm it came back up cleanly (DB connected, no crash loop).

Also go to **Netlify → Site settings → Domain management** and set a custom subdomain if you want a cleaner URL.

---

## 13. Updating the App After Changes

Every time you push new code to `yacine-fixes`, run this on the Droplet:

```bash
cd /var/www/marketili
git pull origin yacine-fixes
cd backend
npm install --omit=dev
pm2 restart marketili-backend
```

> **Why each line:** `git pull` fetches the new commits. `npm install --omit=dev` installs any **new** dependencies (it's a no-op if `package.json` didn't change, so it's safe to always run). `pm2 restart` loads the new code into the running process. Skip the restart and you'd still be serving the old version.

Netlify auto-deploys the frontend on every push — no action needed for the frontend.

> **Why the frontend is automatic:** Netlify watches the GitHub branch and rebuilds on every push. The backend isn't wired to that, so it needs the manual pull + restart above.

If you want auto-deploy for the backend too, you can use a GitHub webhook + a small deploy script, but manual pull + restart is fine for now.

---

## 14. Useful PM2 Commands

```bash
# View running processes
pm2 status

# View live logs
pm2 logs marketili-backend

# View last 100 log lines
pm2 logs marketili-backend --lines 100

# Restart the backend
pm2 restart marketili-backend

# Stop the backend
pm2 stop marketili-backend

# Start after stop
pm2 start marketili-backend

# Reload without downtime
pm2 reload marketili-backend

# Monitor CPU/memory
pm2 monit
```

> **`restart` vs `reload`:** `restart` kills and re-spawns the process (brief downtime, always picks up new code/env). `reload` does a graceful zero-downtime swap — best for routine updates, but for a single-instance app the difference is small. Use `restart` after `.env` changes to be safe.

---

## Quick Troubleshooting

| Problem | Fix |
|---|---|
| `502 Bad Gateway` from Nginx | Backend crashed — run `pm2 restart marketili-backend && pm2 logs` |
| CORS errors in browser | Check `CORS_ORIGIN` in `.env` matches exact Netlify URL (no trailing slash) |
| Socket.io not connecting | Make sure Nginx config has the `Upgrade` and `Connection` headers (step 9a) |
| Images / PDFs not loading (blank or broken icon) | Mixed content. Set `REACT_APP_API_URL=/api` (relative) in Netlify so files load through the HTTPS `netlify.toml` proxy, then redeploy |
| MongoDB connection error | Whitelist the Droplet IP in MongoDB Atlas → Network Access |
| `Permission denied (publickey)` on GitHub | Re-run step 5 and make sure the deploy key was added to the repo |
| `413 Request Entity Too Large` on upload | Raise `client_max_body_size` in the Nginx config (step 9a), then `nginx -t && systemctl reload nginx` |
| Verification emails not arriving | `GMAIL_USER` / `GMAIL_APP_PASSWORD` missing or wrong in `.env` — see `backend/GMAIL_SETUP.md`, then `pm2 restart` |

> **Why `502 Bad Gateway` = backend down:** a 502 means Nginx is up but got no valid response from `localhost:5000` — i.e. Node isn't running. That's why the fix is to restart PM2 and read its logs.

---

## MongoDB Atlas — Whitelist the Droplet IP

Your MongoDB Atlas cluster only allows connections from whitelisted IPs.

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Select your cluster → **Network Access**
3. Click **Add IP Address**
4. Enter your Droplet IP: `157.245.255.43`
5. Click **Confirm**

> **Why:** Atlas blocks all database connections by default and only accepts them from IPs you approve. The backend runs on the Droplet, so the Droplet's IP must be on that list or every query fails with a connection/timeout error.

---

*Last updated: 2026-06-06 — Backend live at `157.245.255.43`*
