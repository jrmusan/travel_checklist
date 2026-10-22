# Travel checklist — architecture

Client-only React app (`app/`) for packing lists organized by **trip type**, with a shared **master item pool** and **per-trip check state**.

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
| **Master pool** | Catalog of categories and items per trip type | Persists in `localStorage`; updated when new items appear in seed data |
| **Trip instance** | One packing run for a trip type (`startedAt`, `status`) | Many per type over time |
| **Trip progress** | Which master item ids are checked for that instance | Reset on each new trip |

Starting a trip creates a new instance with **empty** progress. Ending a trip (or “End & start next”) marks the instance ended; the master pool is unchanged. Only checkmarks are trip-scoped.

### Persistence

Key: `travel-checklist:v1` in `localStorage`.

`PersistedState` (`app/src/types.ts`):

- `schemaVersion` — bump when migrating stored shape
- `masterPool` — `{ categories, items }`
- `trips` — trip instances
- `activeTripId` — current packing session
- `progressByTripId` — map of trip id → `{ checkedItemIds }`

On load, seed data from the registry is **merged** into the master pool (new categories/items from markdown updates are added without wiping user trip history).

## Adding a second trip type

1. Add markdown (optional) under `checklists/`, e.g. `air-travel-essentials.md`.
2. Create `app/src/trip-types/air-travel.ts`:
   - Export `TripTypeDefinition` (id e.g. `air_travel`)
   - Export `loadAirTravelMasterPool()` using `parseMarkdownToMasterPool` or a static list
3. Register the entry in `app/src/trip-types/registry.ts` (`ENTRIES` array).
4. If the persisted schema changes, increment `SCHEMA_VERSION` and extend `migrate()` in `app/src/store/persistence.ts`.

No UI changes are required beyond the registry — the trip type picker and pack view already key off `tripTypeId`.

## Source layout

```
app/src/
  trip-types/     Registry + per-type seed loaders
  seed/           Markdown → master pool parser
  store/          localStorage load/save, trip actions
  components/     Pack view, trip controls, type picker
  types.ts        Shared interfaces
checklists/       Human-editable markdown (camper seed source)
```
