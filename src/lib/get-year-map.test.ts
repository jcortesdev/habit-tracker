import { describe, expect, it } from 'vitest';
import { getYearMap } from './get-year-map';
import type { Entry } from './types';

const entry = (habitId: string, date: string, id = `${habitId}-${date}`): Entry => ({
  id,
  habitId,
  date,
});

describe('getYearMap', () => {
  it('returns an empty map when there are no entries', () => {
    expect(getYearMap([])).toEqual({});
  });

  it('aggregates across all habits when no habitId is given', () => {
    const entries = [
      entry('h1', '2026-05-01'),
      entry('h2', '2026-05-01'),
      entry('h1', '2026-05-02'),
    ];
    expect(getYearMap(entries)).toEqual({
      '2026-05-01': 2,
      '2026-05-02': 1,
    });
  });

  it('filters by habitId when provided', () => {
    const entries = [
      entry('h1', '2026-05-01'),
      entry('h2', '2026-05-01'),
      entry('h1', '2026-05-02'),
    ];
    expect(getYearMap(entries, 'h1')).toEqual({
      '2026-05-01': 1,
      '2026-05-02': 1,
    });
  });

  it('treats explicit null the same as undefined (aggregated view)', () => {
    const entries = [entry('h1', '2026-05-01'), entry('h2', '2026-05-01')];
    expect(getYearMap(entries, null)).toEqual({ '2026-05-01': 2 });
  });
});
