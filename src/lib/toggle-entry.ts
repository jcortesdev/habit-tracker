import type { Entry, IsoDate } from './types';

interface ToggleResult {
  entries: Entry[];
  changed: 'added' | 'removed';
}

/**
 * Toggle a (habitId, date) pair in the entries array.
 * - If an entry exists for that pair, it's removed.
 * - Otherwise a new entry is appended.
 *
 * Pure — caller is responsible for persisting the result.
 */
export function toggleEntry(entries: Entry[], habitId: string, date: IsoDate): ToggleResult {
  const existing = entries.findIndex((e) => e.habitId === habitId && e.date === date);
  if (existing >= 0) {
    const next = entries.slice();
    next.splice(existing, 1);
    return { entries: next, changed: 'removed' };
  }
  return {
    entries: [...entries, { id: crypto.randomUUID(), habitId, date }],
    changed: 'added',
  };
}
