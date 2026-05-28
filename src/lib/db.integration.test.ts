/**
 * Integration test: exercises the real Dexie schema against fake-indexeddb.
 *
 * The pure helpers are unit-tested in their own files without IndexedDB.
 * This file exists to prove the schema, indexes, and basic CRUD round-trip
 * actually work — not to re-test the helpers.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import type { Entry, Habit } from './types';

beforeEach(async () => {
  await db.habits.clear();
  await db.entries.clear();
});

afterEach(async () => {
  await db.habits.clear();
  await db.entries.clear();
});

describe('Dexie schema', () => {
  it('round-trips a habit', async () => {
    const habit: Habit = {
      id: 'h1',
      name: 'Read',
      color: '#22c55e',
      createdAt: 1700000000000,
    };
    await db.habits.add(habit);
    const found = await db.habits.get('h1');
    expect(found).toEqual(habit);
  });

  it('round-trips an entry', async () => {
    const e: Entry = { id: 'e1', habitId: 'h1', date: '2026-05-10' };
    await db.entries.add(e);
    expect(await db.entries.get('e1')).toEqual(e);
  });

  it('resolves a query by the composite [habitId+date] index', async () => {
    await db.entries.bulkAdd([
      { id: 'e1', habitId: 'h1', date: '2026-05-10' },
      { id: 'e2', habitId: 'h2', date: '2026-05-10' },
      { id: 'e3', habitId: 'h1', date: '2026-05-11' },
    ]);

    const match = await db.entries.where('[habitId+date]').equals(['h1', '2026-05-10']).first();
    expect(match?.id).toBe('e1');
  });

  it('queries entries by date alone for the aggregated heatmap', async () => {
    await db.entries.bulkAdd([
      { id: 'e1', habitId: 'h1', date: '2026-05-10' },
      { id: 'e2', habitId: 'h2', date: '2026-05-10' },
      { id: 'e3', habitId: 'h1', date: '2026-05-11' },
    ]);

    const onDate = await db.entries.where('date').equals('2026-05-10').toArray();
    expect(onDate.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
  });

  it('sorts habits by createdAt', async () => {
    await db.habits.bulkAdd([
      { id: 'h2', name: 'Run', color: '#3b82f6', createdAt: 2 },
      { id: 'h1', name: 'Read', color: '#22c55e', createdAt: 1 },
      { id: 'h3', name: 'Meditate', color: '#f59e0b', createdAt: 3 },
    ]);

    const ordered = await db.habits.orderBy('createdAt').toArray();
    expect(ordered.map((h) => h.id)).toEqual(['h1', 'h2', 'h3']);
  });
});
