import { addDays, fromIsoDate } from './iso-date';
import type { Entry, Habit, IsoDate } from './types';

/**
 * First-run demo content: three habits with ~75 days of partial history so a
 * visitor lands on a populated heatmap instead of an empty grid.
 *
 * Pure and deterministic — the inclusion test is a hash of (habit, dayOffset),
 * not `Math.random`, so the same `today` always yields the same dataset. That
 * keeps README screenshots and unit tests stable, and the fixed ids make the
 * demo rows trivial to identify or wipe.
 */

const DAYS = 75;

interface DemoHabit {
  name: string;
  color: string;
  /** Percent of days marked, 0-100. Higher = denser heatmap. */
  density: number;
}

const DEMO_HABITS: DemoHabit[] = [
  { name: 'Read for 20 minutes', color: '#22c55e', density: 70 },
  { name: 'Drink water', color: '#3b82f6', density: 90 },
  { name: 'Morning run', color: '#f59e0b', density: 45 },
];

// Knuth-multiplicative hash → stable pseudo-random in [0, 100).
function shouldMark(habitIndex: number, dayOffset: number, density: number): boolean {
  const h = (dayOffset * 2654435761 + habitIndex * 40503 + 12345) >>> 0;
  return h % 100 < density;
}

export function buildDemoData(today: IsoDate): { habits: Habit[]; entries: Entry[] } {
  const baseCreatedAt = fromIsoDate(addDays(today, -DAYS)).getTime();

  const habits: Habit[] = DEMO_HABITS.map((d, i) => ({
    id: `demo-${i + 1}`,
    name: d.name,
    color: d.color,
    // Stagger createdAt so the list keeps a stable, intentional order.
    createdAt: baseCreatedAt + i * 1000,
  }));

  const entries: Entry[] = [];
  DEMO_HABITS.forEach((d, i) => {
    const habitId = `demo-${i + 1}`;
    for (let offset = 0; offset <= DAYS; offset++) {
      if (shouldMark(i, offset, d.density)) {
        const date = addDays(today, -offset);
        entries.push({ id: `${habitId}-${date}`, habitId, date });
      }
    }
  });

  return { habits, entries };
}
