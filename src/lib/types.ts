/**
 * Core data model. Two stores: habits and entries.
 *
 * `Entry.date` is an ISO `YYYY-MM-DD` string (not a Date object) because it
 * indexes cleanly in IndexedDB, sorts lexicographically, and avoids timezone
 * pitfalls — a habit completed "on Tuesday" is the same Tuesday regardless of
 * the device's clock skew at query time.
 */

export interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Entry {
  id: string;
  habitId: string;
  date: string;
}

export type IsoDate = string;
