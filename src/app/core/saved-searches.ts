import { searchError } from '../../data/room';
import type { RoomSearch } from '../../data/room';

export interface SavedSearch {
  id: string;
  criteria: RoomSearch;
  savedAt: string;
}

const STORAGE_KEY = 'wayfarer-saved-searches';

function isSavedSearch(value: unknown): value is SavedSearch {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<SavedSearch>;
  const criteria = item.criteria;

  return (
    typeof item.id === 'string' &&
    typeof item.savedAt === 'string' &&
    !!criteria &&
    typeof criteria.destination === 'string' &&
    typeof criteria.checkIn === 'string' &&
    typeof criteria.checkOut === 'string' &&
    typeof criteria.guests === 'number' &&
    typeof criteria.maxPrice === 'number' &&
    typeof criteria.breakfast === 'boolean'
  );
}

export function getSavedSearches(): SavedSearch[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]'
    );

    if (!Array.isArray(value)) {
      throw new Error();
    }

    return value.filter(isSavedSearch);
  } catch {
    throw new Error('Unable to load saved searches.');
  }
}

function writeSearches(searches: SavedSearch[]): SavedSearch[] {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(searches)
    );

    return searches;
  } catch {
    throw new Error('Unable to update saved searches.');
  }
}

function sameCriteria(a: RoomSearch, b: RoomSearch): boolean {
  return (
    a.destination === b.destination &&
    a.checkIn === b.checkIn &&
    a.checkOut === b.checkOut &&
    a.guests === b.guests &&
    a.maxPrice === b.maxPrice &&
    a.breakfast === b.breakfast
  );
}

export function saveSearch(criteria: RoomSearch): SavedSearch[] {
  const error = searchError(criteria);

  if (error) {
    throw new Error(error);
  }

  const searches = getSavedSearches();

  // Keep only one copy of identical search criteria.
  const existing = searches.find(search =>
    sameCriteria(search.criteria, criteria)
  );

  const saved: SavedSearch = {
    id:
      existing?.id ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    criteria: { ...criteria },
    savedAt: new Date().toISOString()
  };

  return writeSearches([
    saved,
    ...searches.filter(search => search.id !== saved.id)
  ]);
}

export function removeSavedSearch(id: string): SavedSearch[] {
  return writeSearches(
    getSavedSearches().filter(search => search.id !== id)
  );
}