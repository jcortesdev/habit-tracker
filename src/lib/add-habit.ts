import type { Habit } from './types';

interface AddHabitInput {
  name: string;
  color: string;
  now?: number;
}

/**
 * Build a new Habit. Pure — no Dexie. The caller persists the result.
 * `now` is injected for tests; defaults to `Date.now()`.
 */
export function addHabit({ name, color, now = Date.now() }: AddHabitInput): Habit {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error('Habit name cannot be empty.');
  }
  return {
    id: crypto.randomUUID(),
    name: trimmed,
    color,
    createdAt: now,
  };
}
