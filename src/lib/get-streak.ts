import { addDays, toIsoDate } from './iso-date';
import type { Entry, IsoDate } from './types';

/**
 * Count the current streak for a habit: consecutive days ending today (or
 * yesterday — a habit marked yesterday but not yet today is still a live
 * streak until midnight). Returns 0 if neither today nor yesterday is marked.
 *
 * `today` is injected for tests; defaults to the local-time today.
 */
export function getStreak(entries: Entry[], habitId: string, today?: IsoDate): number {
  const todayIso = today ?? toIsoDate(new Date());
  const dates = new Set(entries.filter((e) => e.habitId === habitId).map((e) => e.date));

  if (dates.size === 0) return 0;

  let cursor: IsoDate;
  if (dates.has(todayIso)) {
    cursor = todayIso;
  } else if (dates.has(addDays(todayIso, -1))) {
    cursor = addDays(todayIso, -1);
  } else {
    return 0;
  }

  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
