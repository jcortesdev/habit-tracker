import { describe, expect, it } from 'vitest';
import { fromIsoDate } from './iso-date';
import { buildDemoData } from './seed-demo-data';

const TODAY = '2026-05-28';

describe('buildDemoData', () => {
  it('creates exactly three demo habits with stable ids and ascending createdAt', () => {
    const { habits } = buildDemoData(TODAY);
    expect(habits.map((h) => h.id)).toEqual(['demo-1', 'demo-2', 'demo-3']);
    expect(habits.map((h) => h.name)).toEqual([
      'Read for 20 minutes',
      'Drink water',
      'Morning run',
    ]);
    expect(habits[0].createdAt).toBeLessThan(habits[1].createdAt);
    expect(habits[1].createdAt).toBeLessThan(habits[2].createdAt);
  });

  it('is deterministic — same input yields an identical dataset', () => {
    expect(buildDemoData(TODAY)).toEqual(buildDemoData(TODAY));
  });

  it('only references known demo habit ids', () => {
    const { habits, entries } = buildDemoData(TODAY);
    const ids = new Set(habits.map((h) => h.id));
    for (const e of entries) expect(ids.has(e.habitId)).toBe(true);
  });

  it('keeps every entry within the last 75 days, today inclusive', () => {
    const { entries } = buildDemoData(TODAY);
    const todayMs = fromIsoDate(TODAY).getTime();
    const earliestMs = todayMs - 75 * 864e5;
    for (const e of entries) {
      const t = fromIsoDate(e.date).getTime();
      expect(t).toBeGreaterThanOrEqual(earliestMs);
      expect(t).toBeLessThanOrEqual(todayMs);
    }
  });

  it('produces unique entry ids', () => {
    const { entries } = buildDemoData(TODAY);
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
  });

  it('respects the density ordering (water > read > run)', () => {
    const { entries } = buildDemoData(TODAY);
    const count = (id: string) => entries.filter((e) => e.habitId === id).length;
    expect(count('demo-2')).toBeGreaterThan(count('demo-1'));
    expect(count('demo-1')).toBeGreaterThan(count('demo-3'));
  });
});
