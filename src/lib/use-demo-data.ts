'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from './db';
import { toIsoDate } from './iso-date';
import { buildDemoData } from './seed-demo-data';
import type { Habit } from './types';

// localStorage keys. These hold UI state (has the device been seeded? is the
// demo banner showing?), never habit data — Dexie stays the single source of
// truth for that. Mirrors how the theme preference already lives here.
const SEEDED_KEY = 'ht-seeded';
const DEMO_KEY = 'ht-demo';

interface DemoState {
  /** Demo content is currently present and the banner should show. */
  isDemo: boolean;
  /** First-run seed is in flight — render the skeleton, not the empty state. */
  seeding: boolean;
  /** Wipe all habits + entries and dismiss the banner for good. */
  clearDemo: () => Promise<void>;
}

/**
 * On a fresh device (no habits yet, never seeded) this writes the demo dataset
 * once so visitors land on a populated heatmap. The seed runs exactly once per
 * device — clearing the demo never re-triggers it.
 */
export function useDemoData(habits: Habit[] | undefined): DemoState {
  const [isDemo, setIsDemo] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    setIsDemo(localStorage.getItem(DEMO_KEY) === '1');
  }, []);

  useEffect(() => {
    if (habits === undefined) return; // still loading
    if (habits.length > 0) return; // user already has data
    if (localStorage.getItem(SEEDED_KEY) === '1') return; // seeded before

    localStorage.setItem(SEEDED_KEY, '1');
    localStorage.setItem(DEMO_KEY, '1');
    setSeeding(true);

    const { habits: demoHabits, entries } = buildDemoData(toIsoDate(new Date()));
    db.transaction('rw', db.habits, db.entries, async () => {
      await db.habits.bulkAdd(demoHabits);
      await db.entries.bulkAdd(entries);
    })
      .then(() => {
        setIsDemo(true);
      })
      .finally(() => {
        setSeeding(false);
      });
  }, [habits]);

  const clearDemo = useCallback(async () => {
    await db.transaction('rw', db.habits, db.entries, async () => {
      await db.entries.clear();
      await db.habits.clear();
    });
    localStorage.removeItem(DEMO_KEY);
    setIsDemo(false);
  }, []);

  return { isDemo, seeding, clearDemo };
}
