'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Habit } from './types';

/**
 * Subscribe to all habits, ordered by creation time (oldest first).
 * Returns `undefined` while the initial query is in flight, then an array.
 */
export function useHabits(): Habit[] | undefined {
  return useLiveQuery(() => db.habits.orderBy('createdAt').toArray(), []);
}
