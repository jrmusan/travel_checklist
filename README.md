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
| **Build Command** | *(default)* `npm run build` |
| **Output Directory** | *(default)* `dist` |

SPA client routing + `/api` serverless functions are configured in [`app/vercel.json`](app/vercel.json).

#### B. Repo root — no Root Directory override

Leave **Root Directory** empty. Root [`vercel.json`](vercel.json) builds `app/dist` but **does not deploy** `app/api` — use only for static preview without login.

### 3. Database on Vercel (Joey’s ordered steps)

1. In the Vercel project, open **Storage** → **Create Database** → **Postgres** (or connect an existing Neon project and copy its connection string).
2. Link the database to this project so **`POSTGRES_URL`** is injected automatically (Production and Preview as you prefer).
3. Locally or via `psql`, run the schema once against that database:
   ```bash
   cd app
   export POSTGRES_URL="…"   # same URL Vercel shows
   npm run db:migrate
   ```
4. Redeploy after storage is linked so serverless functions receive `POSTGRES_URL`.

### 4. Environment variables

In **Project → Settings → Environment Variables**:

| Name | Environments | Value |
| --- | --- | --- |
| `POSTGRES_URL` | Production, Preview | Usually auto-set when Postgres is linked; otherwise paste from Neon |
| `SESSION_SECRET` | Production, Preview | Generate a long random string (e.g. `openssl rand -base64 32`) — **never commit** |

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
