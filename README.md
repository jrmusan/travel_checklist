# Joey's Travel Checklists

Personal travel packing checklists by **trip type** (camper today, more types later). A **master item pool** defines everything you might pack; **each new trip starts with nothing checked** so you get a clean slate every time.

**What is on `main` today**

| Piece | Location | Notes |
| --- | --- | --- |
| Camping checklist (markdown) | [`checklists/camping-essentials.md`](checklists/camping-essentials.md) | Edit in Git or locally; commit to save progress |
| Static landing page | [`index.html`](index.html) | Shown at your Vercel subdomain until the web app ships |
| Trip-type web app | *(not on `main` yet)* | Will live under `app/` when merged; this README will list Node commands from that folder |

Interactive prototype (not wired to the trip-type model yet): [Camping essentials canvas](https://cursor.com/canvas/store-4d363013-7ab0-46aa-a7c0-b31b5059e469/695d0bf4-d34e-43cb-866e-2d4b31de46be).

---

## Run locally

Always reconcile with GitHub before you start:

```bash
git pull origin main
```

### A. Markdown checklists (works on `main` now)

No Node.js or database is required to view or edit the camping list.

**Prerequisites**

- [Git](https://git-scm.com/downloads) 2.30+
- Any text editor (VS Code, Cursor, etc.)

**Clone**

HTTPS:

```bash
git clone https://github.com/jrmusan/travel_checklist.git
cd travel_checklist
```

SSH:

```bash
git clone git@github.com:jrmusan/travel_checklist.git
cd travel_checklist
```

**Use the checklist**

- Open [`checklists/camping-essentials.md`](checklists/camping-essentials.md) and toggle `- [ ]` / `- [x]` items.
- Commit and push when you want history on GitHub:

```bash
git add checklists/camping-essentials.md
git commit -m "Update camping checklist"
git push origin main
```

**Optional — preview the static landing page**

If you have Node 20+:

```bash
npx --yes serve . -l 3000
```

Open [http://localhost:3000](http://localhost:3000). (Any static file server on the repo root works the same way.)

**Environment variables:** none for markdown-only workflow.

**Database:** none — files in Git are the source of truth.

---

### B. Trip-type web app (after `app/` appears on `main`)

Another change set may add a Vite (or similar) app under `app/`. **Do not guess the stack** — after `git pull origin main`, check whether `app/package.json` exists.

**If `app/package.json` is missing:** use [section A](#a-markdown-checklists-works-on-main-now) only.

**If `app/package.json` exists:** use these steps (adjust only if that file’s `scripts` differ):

**Prerequisites**

- **Node.js 20 LTS** (or the version in `app/.nvmrc` / `app/package.json` `engines`, if present)
- **npm** (comes with Node; use **pnpm** or **yarn** only if the repo has `pnpm-lock.yaml` or `yarn.lock`)

**Install**

```bash
cd app
npm install
```

**Environment variables**

1. Copy the example env file if the repo provides one:

   ```bash
   cp .env.example .env
   ```

2. Fill in every key listed in `.env.example` (each variable is documented there).

3. In the Vercel section below, set the **same keys** in Project → Settings → Environment Variables.

| Situation | What to do |
| --- | --- |
| **No `.env.example` and no server API** | App likely uses **browser storage only** (e.g. `localStorage`) — no DB or env vars for local run. |
| **`.env.example` mentions `DATABASE_URL`** | Use the database steps in that file (Postgres via Vercel Postgres, Neon, Turso, SQLite file path, etc. — follow the exact product named in comments). |
| **ORM scripts in `package.json`** | Typical names: `npm run db:migrate`, `npm run db:push`, `npm run db:seed` — run them in `app/` after the DB is reachable. |

**Database setup (only if the app uses a server database)**

Run the commands named in `app/package.json` and `README` / `.env.example` inside `app/`, for example:

```bash
cd app
npm run db:migrate   # if defined
npm run db:seed      # if defined
```

**Start dev server**

```bash
cd app
npm run dev
```

Default URL is usually **http://localhost:5173** (Vite) or **http://localhost:3000** — read the terminal output after `npm run dev`.

---

## Deploy to Vercel (subdomain on Joey’s domain)

Joey already hosts a **book club site** on Vercel with a custom domain. Use the **same Vercel team/account** and add a **subdomain** for this project (e.g. `checklist.yourdomain.com` or `travel.yourdomain.com` — pick the prefix you want).

### 1. Import the GitHub repo

1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. **Add New… → Project**.
3. **Import** `jrmusan/travel_checklist` (connect GitHub if prompted).
4. Select the **same team** as the book club project.

### 2. Build settings (match what is on `main`)

After import, open **Project → Settings → General → Build & Development Settings**.

**Current `main` (static landing + markdown, no `app/` build):**

| Setting | Value |
| --- | --- |
| **Framework Preset** | Other |
| **Root Directory** | `.` (repository root — leave blank) |
| **Install Command** | leave empty or `echo "no install"` |
| **Build Command** | leave empty |
| **Output Directory** | `.` |

[`vercel.json`](vercel.json) at the repo root sets `"framework": null` and `"outputDirectory": "."` so Vercel serves `index.html` and `checklists/` as static files.

**After the web app merges (when `app/` exists):**

| Setting | Value |
| --- | --- |
| **Root Directory** | `app` |
| **Install Command** | `npm install` (or as documented in the app) |
| **Build Command** | `npm run build` (must match `app/package.json`) |
| **Output Directory** | Usually `dist` (Vite) or `.next` (Next.js) — match the app docs |

Redeploy after changing Root Directory.

### 3. Database on Vercel

**Today on `main`:** there is **no server database**. Checklist data for markdown lives in Git; no Vercel Postgres / Neon / Turso step is required for the static site.

**When the web app uses a database:**

1. **Vercel Postgres:** Project → **Storage** → **Create Database** → **Postgres** → connect to this project. Vercel injects `POSTGRES_URL` (and related vars). Copy them into **Settings → Environment Variables** if they are not linked automatically.
2. **Neon:** Create a project at [neon.tech](https://neon.tech), copy the connection string into `DATABASE_URL` (or the name in `.env.example`).
3. **Turso:** Create a DB in Turso, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` per `.env.example`.

Then run migrations **once** against production:

- **Option A — Vercel CLI** (from your machine, with prod env):

  ```bash
  cd app
  npx vercel env pull .env.production.local
  npm run db:migrate
  ```

- **Option B — SQL/console** in the provider dashboard, if the app documents manual migration.

**When the web app is client-only (`localStorage`, no `DATABASE_URL`):** skip database creation; data stays in each visitor’s browser.

### 4. Environment variables in Vercel

**Project → Settings → Environment Variables**

**Static site on `main` today:** none required.

**Web app:** add every key from `app/.env.example`:

- Set **Production** (and **Preview** if preview deployments should talk to a staging DB or the same read-only API).
- Do **not** commit `.env` — only set values in Vercel (and local `.env`).

### 5. Subdomain (same account as book club)

1. Open **this** project → **Settings → Domains**.
2. **Add** e.g. `checklist.example.com` (replace `example.com` with Joey’s real domain).
3. DNS:
   - **Domain already on Vercel** (from the book club site): Vercel may offer to add the subdomain to this project; confirm the CNAME/host record it shows.
   - **DNS elsewhere:** create a **CNAME** for `checklist` (or `travel`) pointing to `cname.vercel-dns.com` (or the target Vercel shows).

Adding the subdomain attaches it to **this** Vercel project’s deployments. The book club **apex** (`example.com`) stays on the book club project; only the **subdomain** points here.

### 6. Deploy, verify, common fixes

1. **Deploy:** push to `main` or click **Deploy** in Vercel. Production URL will be `https://<subdomain>.<your-domain>`.
2. **Verify static site:** root loads [`index.html`](index.html); GitHub links on that page open the markdown checklist.
3. **Verify web app (when present):** open the subdomain, create a trip, confirm a fresh checklist; hard-refresh and confirm behavior matches local dev.

| Problem | Fix |
| --- | --- |
| **Build fails** | Confirm **Root Directory** is `.` vs `app/`; run `npm run build` locally in that folder. |
| **Missing env** | Vercel build logs name the variable; add it under Environment Variables and redeploy. |
| **404 on client routes** (SPA) | Add a rewrite in `vercel.json` (only for SPA apps): `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` — do **not** add this for the current static-only root deploy. |
| **Blank page after app deploy** | Check **Output Directory** matches the build output (`dist`, etc.). |

---

## Links

- [Camping essentials checklist](checklists/camping-essentials.md)
- [Interactive camping canvas](https://cursor.com/canvas/store-4d363013-7ab0-46aa-a7c0-b31b5059e469/695d0bf4-d34e-43cb-866e-2d4b31de46be)
- Architecture doc: *not in repo yet* — when [`docs/architecture.md`](docs/architecture.md) exists, it will describe trip types, master pool, and per-trip state.

---

## Repo maintenance

Before editing docs or app code:

```bash
git pull origin main
```

That avoids clobbering in-flight work (e.g. the trip-type web app under `app/`).
