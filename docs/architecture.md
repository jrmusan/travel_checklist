# Travel checklist — architecture

React app (`app/`) for packing lists organized by **trip type**, with a shared **master item pool**, **per-trip check state**, and **team-based auth** so everyone on a trip team shares the same packing progress.

## Concepts

### Trip types

A trip type is a first-class category of travel (e.g. `camper`, later `air_travel`). Each type has:

- Metadata (`TripTypeDefinition`): id, slug, name, icon, description
- A **master pool** slice: categories and items scoped by `tripTypeId`

Trip types are registered in `app/src/trip-types/registry.ts`. The UI lists types from that registry — it does not assume a single type.

**Today:** only `camper` is registered, seeded from `checklists/camping-essentials.md`.

### Master pool vs trip instances

| Layer | What it stores | Lifetime |
|--------|----------------|----------|
| **Master pool** | Catalog of categories and items per trip type | Seeded from registry markdown on first team load, then **stored per team** as JSON on `team_trip_state.state.catalog` |
| **Trip instance** | One packing run: type, optional `name` (destination), `startDate`/`endDate`, `startedAt`, `status` | Many per type over time; **stored per team on the server** |
| **Trip progress** | Which master item ids are checked for that instance | Reset on each new trip; **stored per team on the server** |

Starting a trip creates a new instance with **empty** progress, a destination name, and calendar dates. Ending a trip archives that name/dates; the next trip is a clean packing slate (new name + dates). Older trips without `name` fall back to the trip-type label. Catalog edits (add/rename/move/delete items) change the team master pool for that trip type and apply to future trips; only checkmarks are trip-scoped.

### Team auth and shared state

- **Trip team** = shared account (team name + password). All members sign in with the same credentials and see the same trips and checkmarks.
- **Sign in / Create account** on a woodsy-themed login gate; unauthenticated users never see the checklist.
- Passwords are **bcrypt-hashed** server-side; sessions use an **httpOnly cookie** (signed JWT via `SESSION_SECRET`).
- Server routes live under `app/api/` (Vercel serverless) and use **Postgres** (`POSTGRES_URL`, e.g. Vercel Postgres or Neon).

**Database tables** (`app/db/schema.sql`):

| Table | Purpose |
|--------|---------|
| `teams` | Unique team name (case-insensitive), password hash |
| `team_trip_state` | JSONB `{ schemaVersion, trips, activeTripId, progressByTripId, catalog, removedItemIds }` per team |

`catalog` is the team’s full master pool (categories + items). If it is missing, the client seeds from trip-type markdown and the next save writes it. `removedItemIds` keeps deleted seed items from coming back when markdown grows. No extra table or breaking migration — optional keys on the same JSONB column. Teams can add/rename/move/delete items; check state stays on the item id.

**One-time migration:** If a browser had trip data in `localStorage` before login, the first successful load uploads that trip slice to the team when the server state is empty.

### Client persistence (UI only)

| Key | Purpose |
|-----|---------|
| `travel-checklist:category-expanded:v1` | Which category sections are expanded (accordion); session UI preference |
| `travel-checklist:v1` | Legacy pre-auth trip data; read once for migration after login |

Trip progress is **not** kept in `localStorage` after team auth is enabled — it syncs through `GET/PUT /api/state` with debounced saves.

### Pack list UX

- **Full list** is the default view: checked items stay in category order with strikethrough; only the checkbox state changes.
- **Still to pack** filter hides checked items while that filter is active.
- Categories are **collapsible**; collapsed headers show progress (`packed/total`).

## Adding a second trip type

1. Add markdown (optional) under `checklists/`, e.g. `air-travel-essentials.md`.
2. Create `app/src/trip-types/air-travel.ts`:
   - Export `TripTypeDefinition` (id e.g. `air_travel`)
   - Export `loadAirTravelMasterPool()` using `parseMarkdownToMasterPool` or a static list
3. Register the entry in `app/src/trip-types/registry.ts` (`ENTRIES` array).
4. If the persisted schema changes, increment `SCHEMA_VERSION` and extend migration logic in `app/src/store/persistence.ts` and server state normalization in `app/api/_lib/db.ts`.

No UI changes are required beyond the registry — the trip type picker and pack view already key off `tripTypeId`.

## Source layout

```
app/
  api/            Vercel serverless: auth + team state
  db/             Postgres schema
  scripts/        db:migrate helper
  src/
    api/          Browser fetch helpers
    trip-types/   Registry + per-type seed loaders
    seed/         Markdown → master pool parser
    store/        Trip actions, server sync helpers
    hooks/        Auth, team state, category accordion
    components/   Pack view, login, trip controls
    types.ts      Shared interfaces
checklists/       Human-editable markdown (camper seed source)
```

## Local development

- **UI only:** `npm run dev` (Vite). Auth API calls fail unless something serves `/api` (see below).
- **Full stack:** `npm run db:migrate` with `POSTGRES_URL`, set `SESSION_SECRET`, then `npm run dev:full` (`vercel dev`) — Vite is proxied and `/api` hits serverless handlers.
- **Production build:** `npm ci && npm run build` (static client + TypeScript check; API deploys with the Vercel project when Root Directory is `app`).
