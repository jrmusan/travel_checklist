/** Versioned persistence schema — bump when shape changes. */
export const SCHEMA_VERSION = 2;

export type TripTypeId = string;

export interface TripTypeDefinition {
  id: TripTypeId;
  slug: string;
  name: string;
  icon: string;
  description: string;
}

export interface MasterCategory {
  id: string;
  tripTypeId: TripTypeId;
  name: string;
  order: number;
}

export interface MasterItem {
  id: string;
  tripTypeId: TripTypeId;
  categoryId: string;
  label: string;
  order: number;
}

/** Catalog of items per trip type — shared across all trip instances. */
export interface MasterPool {
  categories: MasterCategory[];
  items: MasterItem[];
}

export type TripStatus = "active" | "ended";

export interface TripInstance {
  id: string;
  tripTypeId: TripTypeId;
  startedAt: string;
  endedAt?: string;
  status: TripStatus;
}

/** Per-trip packing progress only — never mutates the master pool. */
export interface TripProgress {
  checkedItemIds: string[];
}

export interface PersistedState {
  schemaVersion: number;
  masterPool: MasterPool;
  trips: TripInstance[];
  activeTripId: string | null;
  /** tripInstanceId → progress */
  progressByTripId: Record<string, TripProgress>;
}

export type PackFilter = "all" | "remaining";
