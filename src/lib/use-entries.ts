'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Entry } from './types';

/**
 * Subscribe to all entries. The full array is what the pure helpers
 * (getStreak, getYearMap) consume; filtering and aggregation happen
 * in React-land. With reasonable habit counts (dozens) and a year of
 * data per habit, this is comfortably under 10k rows — cheap to ship
 * whole.
 */
export function useEntries(): Entry[] | undefined {
  return useLiveQuery(() => db.entries.toArray(), []);
}

/**
 * Subscribe to entries for a single habit. Useful for per-habit views
 * that don't want to re-render when an unrelated habit changes.
 */
export function useHabitEntries(habitId: string | null | undefined): Entry[] | undefined {
  return useLiveQuery(() => {
    if (!habitId) return [];
    return db.entries.where('habitId').equals(habitId).toArray();
  }, [habitId]);
}
