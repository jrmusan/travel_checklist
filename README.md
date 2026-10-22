# Joey's Travel Checklists

Personal travel packing checklists by **trip type** (camper today, more types later). A **master item pool** defines everything you might pack; **each new trip starts with nothing checked** so you get a clean slate every time.

**Trip teams** sign in with a shared **team name + password** so everyone on the crew sees the same packing progress across devices.

**What is on `main` today**

| Piece | Location | Notes |
| --- | --- | --- |
| Camping checklist (markdown) | [`checklists/camping-essentials.md`](checklists/camping-essentials.md) | Edit in Git or locally; seeds the camper master pool in the app |
| Trip-type web app | [`app/`](app/) | Vite + React; team auth + Postgres-backed shared trip state |
| Misconfigured-deploy fallback | [`index.html`](index.html) | Only served if Vercel deploys repo root without building `app/` |
| Architecture | [`docs/architecture.md`](docs/architecture.md) | Trip types, master pool, team auth, server state |

Interactive prototype (not wired to the trip-type model yet): [Camping essentials canvas](https://cursor.com/canvas/store-4d363013-7ab0-46aa-a7c0-b31b5059e469/695d0bf4-d34e-43cb-866e-2d4b31de46be).

---

## Run locally

Always reconcile with GitHub before you start:

```bash
git pull origin main
```

### A. Markdown checklists

No Node.js required to view or edit the camping list.

**Clone**

```bash
git clone https://github.com/jrmusan/travel_checklist.git
cd travel_checklist
```

Open [`checklists/camping-essentials.md`](checklists/camping-essentials.md) and toggle `- [ ]` / `- [x]` items. Commit and push when you want history on GitHub.

**Optional — preview the static landing page**

```bash
npx --yes serve . -l 3000
```

Open [http://localhost:3000](http://localhost:3000).

---

### B. Trip-type web app (`app/`)

**Prerequisites:** Node.js 20+, npm, and a Postgres database for auth (Neon free tier or Vercel Postgres).

```bash
cd app
cp .env.example .env.local
# Edit .env.local — set POSTGRES_URL and SESSION_SECRET
npm install
npm run db:migrate
```

**Full stack (auth + API + UI)**

```bash
cd app
npm run dev:full
```

Open the URL Vercel prints (usually [http://localhost:3000](http://localhost:3000)). Create a trip team account, start a camper trip, check items, collapse a category, and sign out/in to confirm state persists.

**UI only (no API)**

```bash
cd app
npm run dev
```

Vite runs on [http://localhost:5173](http://localhost:5173) and proxies `/api` to port 3000 — you still need `vercel dev` on 3000 or auth will fail.

**UI with a mock API (no database)**

```bash
cd app
npm run mock-api   # in-memory stand-in for /api on port 3000
npm run dev        # in a second terminal
```

Accounts and trips live in memory and reset when `mock-api` stops. Handy for styling work and phone-sized screenshots.

**Styling:** the CampList look lives in `app/src/styles/` — `tokens.css` (Forest / Sunset / Night theme variables), `base.css`, `components.css`, `screens.css`. Illustrations are compressed webp files in `app/src/assets/scenes/`; icons are inline SVG in `app/src/components/icons/`.

**Production build**

```bash
cd app
npm ci
npm run build
npm run preview
```

**Environment variables** (see [`app/.env.example`](app/.env.example)):

| Variable | Required | Purpose |
| --- | --- | --- |
| `POSTGRES_URL` | Yes (for auth) | Postgres connection string (Vercel Postgres, Neon, etc.) |
| `SESSION_SECRET` | Yes (for auth) | Long random secret for signing session cookies (≥ 32 chars) |

See [docs/architecture.md](docs/architecture.md) for the data model and how to add a new trip type.

---

## Deploy to Vercel (subdomain on Joey’s domain)

Use the **same Vercel team/account** as the book club site and add a **subdomain** for this project.

Team login and shared packing state **require Postgres and serverless API routes**. Use **Root Directory `app`** (path A below). The repo-root deploy path (B) ships the static UI only — **no auth API**.

### 1. Import the GitHub repo

Import `jrmusan/travel_checklist` in the [Vercel Dashboard](https://vercel.com/dashboard).

### 2. Build settings

#### A. Recommended — Root Directory `app` (required for team auth)

In the Vercel project: **Settings → General → Root Directory** → `app` (Apply).

| Setting | Value |
| --- | --- |
| **Root Directory** | `app` |
| **Install Command** | *(default)* `npm install` |
| **Build Command** | *(default)* `npm run vercel-build` (runs `db:migrate` then `build` when Root Directory is `app`) |
| **Output Directory** | *(default)* `dist` |

SPA client routing + `/api` serverless functions are configured in [`app/vercel.json`](app/vercel.json).

Each production deploy applies [`app/db/schema.sql`](app/db/schema.sql) idempotently (`CREATE … IF NOT EXISTS`) as long as **`POSTGRES_URL`** is available at build time (normal when Postgres/Neon is linked to the project).

#### B. Repo root — no Root Directory override

Leave **Root Directory** empty. Root [`vercel.json`](vercel.json) builds `app/dist` but **does not deploy** `app/api` — use only for static preview without login.

### 3. Database on Vercel (Joey’s ordered steps)

1. In the Vercel project, open **Storage** → **Create Database** → **Postgres** (or connect an existing Neon project and copy its connection string).
2. Link the database to this project so **`POSTGRES_URL`** is injected automatically (Production and Preview as you prefer).
3. **First schema apply** — pick one (see [Fix: `relation "teams" does not exist`](#fix-relation-teams-does-not-exist) if signup fails):
   - Redeploy with Postgres linked (build runs `npm run vercel-build` → auto-migrate), or
   - Run locally: `cd app && POSTGRES_URL="…" npm run db:migrate`, or
   - Neon **SQL Editor**: paste [`app/db/schema.sql`](app/db/schema.sql) and run.
4. Redeploy after storage is linked so serverless functions receive `POSTGRES_URL`.

### 4. Environment variables

In **Project → Settings → Environment Variables**:

| Name | Environments | Value |
| --- | --- | --- |
| `POSTGRES_URL` | Production, Preview | Usually auto-set when Postgres is linked; otherwise paste from Neon |
| `SESSION_SECRET` | Production, Preview | Generate a long random string (e.g. `openssl rand -base64 32`) — **never commit** |
| `SETUP_SECRET` | Production *(optional)* | Enables one-time `GET /api/setup/migrate?secret=…` (≥16 chars); remove or rotate after use |

Redeploy after adding or changing variables.

### 5. Subdomain

Project → **Settings → Domains** → add e.g. `checklist.example.com` and follow Vercel’s DNS instructions.

### 6. Verify

1. Open the live URL — you should see the **Sign in / Create account** page (woodsy theme).
2. **Create account** with a trip team name and password.
3. Start a camper trip, check an item (it stays in place in **Full list**), switch to **Still to pack**, collapse a category and confirm `3/12`-style progress in the header.
4. Open the same team on another browser or device — checkmarks should match.
5. **Log out** and sign back in.

---

## Install on iPhone (Home Screen)

CampList is a Progressive Web App. After deploy, add it from **Safari** (Chrome on iOS cannot install it):

1. Open **Safari** and go to `https://travel.jrmusan.com` (the `*.vercel.app` URL works the same).
2. Tap the **Share** button (square with an arrow, at the bottom of the screen).
3. Scroll the sheet and tap **Add to Home Screen**.
4. Tap **Add**.

CampList then launches from the Home Screen icon **full-screen** (no Safari chrome). Packing still needs a network connection to sign in and sync; the UI shell stays available if the connection drops.

---

## Fix: `relation "teams" does not exist`

Signup or sign-in returns **500** and logs `NeonDbError: relation "teams" does not exist` when Postgres is linked but the schema was never applied.

**Option A — Neon / Postgres SQL console**

1. Open your database in the [Neon dashboard](https://console.neon.tech) (or Vercel Storage → your DB → query UI).
2. Paste the full contents of [`app/db/schema.sql`](app/db/schema.sql) and execute.
3. Retry **Create account** on the live site.

**Option B — Local CLI**

```bash
cd app
export POSTGRES_URL="…"   # same connection string as Vercel Production
npm run db:migrate
```

**Option C — Auto-migrate on deploy (after this repo is on `main`)**

With **Root Directory** `app` and **`POSTGRES_URL`** set for Production, Vercel runs `npm run vercel-build`, which runs `db:migrate` before the Vite build. Redeploy once; tables are created if missing.

**Option D — One-time HTTP setup (optional)**

1. Set `SETUP_SECRET` (≥16 characters) on the Vercel project and redeploy.
2. Open `https://YOUR-DOMAIN/api/setup/migrate?secret=YOUR_SETUP_SECRET` once in the browser.
3. Expect `{"ok":true,...}`. Rotate or remove `SETUP_SECRET` when done.

Validate the schema file without a database: `cd app && npm run db:migrate:check`.

---

## Links

- [Camping essentials checklist](checklists/camping-essentials.md)
- [Architecture](docs/architecture.md)
- [Interactive camping canvas](https://cursor.com/canvas/store-4d363013-7ab0-46aa-a7c0-b31b5059e469/695d0bf4-d34e-43cb-866e-2d4b31de46be)

---

## Repo maintenance

```bash
git pull origin main
```

That avoids clobbering in-flight work on shared branches.
