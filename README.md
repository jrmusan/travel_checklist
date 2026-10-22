# Joey's Travel Checklists

Personal travel packing checklists by **trip type** (camper today, more types later). A **master item pool** defines everything you might pack; **each new trip starts with nothing checked** so you get a clean slate every time.

**What is on `main` today**

| Piece | Location | Notes |
| --- | --- | --- |
| Camping checklist (markdown) | [`checklists/camping-essentials.md`](checklists/camping-essentials.md) | Edit in Git or locally; seeds the camper master pool in the app |
| Trip-type web app | [`app/`](app/) | Vite + React; `localStorage` only — no server DB |
| Static landing page | [`index.html`](index.html) | Repo-root static page until Vercel root is pointed at `app/` |
| Architecture | [`docs/architecture.md`](docs/architecture.md) | Trip types, master pool, trip instances |

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

**Prerequisites:** Node.js 20+ and npm.

```bash
cd app
npm install
npm run dev
```

Open the URL Vite prints (default [http://localhost:5173](http://localhost:5173)).

**Production build**

```bash
cd app
npm run build
npm run preview
```

**Environment variables:** none — packing progress is stored in the browser (`localStorage`).

**Database:** none.

See [docs/architecture.md](docs/architecture.md) for the data model and how to add a new trip type.

---

## Deploy to Vercel (subdomain on Joey’s domain)

Use the **same Vercel team/account** as the book club site and add a **subdomain** for this project.

### 1. Import the GitHub repo

Import `jrmusan/travel_checklist` in the [Vercel Dashboard](https://vercel.com/dashboard).

### 2. Build settings

**Recommended (web app):**

| Setting | Value |
| --- | --- |
| **Root Directory** | `app` |
| **Install Command** | `npm install` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

Add SPA rewrites if client routes are added later, e.g. in `app/vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Legacy static-only deploy** (repo root, no app build): see [`vercel.json`](vercel.json) at the repository root (`framework: null`, output `.`).

### 3. Database on Vercel

Not required — the app is client-only.

### 4. Environment variables

None required for the current app.

### 5. Subdomain

Project → **Settings → Domains** → add e.g. `checklist.example.com` and follow Vercel’s DNS instructions.

### 6. Verify

Create a camper trip, pack an item, use **End & start next**, and confirm checkboxes reset while the master list stays the same.

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
