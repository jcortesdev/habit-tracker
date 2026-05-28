import Dexie, { type EntityTable } from 'dexie';
import type { Entry, Habit } from './types';

/**
 * Thin Dexie client. Declares stores, indexes, and migrations only.
 * Business logic lives in the pure helpers (addHabit, toggleEntry, etc.)
 * so it can be tested without touching IndexedDB.
 */
class HabitTrackerDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>;
  entries!: EntityTable<Entry, 'id'>;

  constructor() {
    super('habit-tracker');

    // Composite index on entries lets us answer "did this habit happen on
    // this date?" with a single key lookup. Plain `date` is also indexed
    // so the yearly heatmap aggregation can scan one day at a time.
    this.version(1).stores({
      habits: 'id, createdAt',
      entries: 'id, habitId, date, [habitId+date]',
    });
  }
}

export const db = new HabitTrackerDB();
export type { Habit, Entry } from './types';
