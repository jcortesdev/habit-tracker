import type { Entry, IsoDate } from './types';

/**
 * Aggregate entries by date into a count map suitable for the heatmap.
 *
 * - When `habitId` is null/undefined, counts entries across ALL habits per day
 *   (so a day where 2 different habits were marked returns 2).
 * - When `habitId` is provided, counts only that habit (max 1 per day given
 *   toggleEntry's contract, but we still aggregate defensively).
 */
export function getYearMap(entries: Entry[], habitId?: string | null): Record<IsoDate, number> {
  const out: Record<IsoDate, number> = {};
  for (const entry of entries) {
    if (habitId != null && entry.habitId !== habitId) continue;
    out[entry.date] = (out[entry.date] ?? 0) + 1;
  }
  return out;
}
