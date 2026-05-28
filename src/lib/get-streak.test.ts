import { describe, expect, it } from 'vitest';
import { getStreak } from './get-streak';
import type { Entry } from './types';

const entry = (habitId: string, date: string, id = `${habitId}-${date}`): Entry => ({
  id,
  habitId,
  date,
});

describe('getStreak', () => {
  it('returns 0 when there are no entries', () => {
    expect(getStreak([], 'h1', '2026-05-10')).toBe(0);
  });

  it('returns 0 when the habit was last marked more than one day ago', () => {
    const entries = [entry('h1', '2026-05-05')];
    expect(getStreak(entries, 'h1', '2026-05-10')).toBe(0);
  });

  it('counts a single mark today as a streak of 1', () => {
    const entries = [entry('h1', '2026-05-10')];
    expect(getStreak(entries, 'h1', '2026-05-10')).toBe(1);
  });

  it('counts a streak ending yesterday (still live until midnight)', () => {
    const entries = [entry('h1', '2026-05-08'), entry('h1', '2026-05-09')];
    expect(getStreak(entries, 'h1', '2026-05-10')).toBe(2);
  });

  it('counts consecutive days ending today', () => {
    const entries = [
      entry('h1', '2026-05-07'),
      entry('h1', '2026-05-08'),
      entry('h1', '2026-05-09'),
      entry('h1', '2026-05-10'),
    ];
    expect(getStreak(entries, 'h1', '2026-05-10')).toBe(4);
  });

  it('stops counting at the first gap', () => {
    const entries = [
      entry('h1', '2026-05-05'),
      // gap on 2026-05-06
      entry('h1', '2026-05-07'),
      entry('h1', '2026-05-08'),
      entry('h1', '2026-05-09'),
      entry('h1', '2026-05-10'),
    ];
    expect(getStreak(entries, 'h1', '2026-05-10')).toBe(4);
  });

  it('ignores other habits', () => {
    const entries = [
      entry('h1', '2026-05-10'),
      entry('h2', '2026-05-09'),
      entry('h2', '2026-05-08'),
    ];
    // h2 has yesterday + the day before — a live 2-day streak.
    expect(getStreak(entries, 'h2', '2026-05-10')).toBe(2);
    // h1 has only today — a 1-day streak.
    expect(getStreak(entries, 'h1', '2026-05-10')).toBe(1);
    // h3 has no entries.
    expect(getStreak(entries, 'h3', '2026-05-10')).toBe(0);
  });
});
