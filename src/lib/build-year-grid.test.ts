import { describe, expect, it } from 'vitest';
import { buildYearGrid } from './build-year-grid';
import { addDays, fromIsoDate } from './iso-date';

describe('buildYearGrid', () => {
  it('returns 53 columns of 7 days each', () => {
    const { weeks } = buildYearGrid('2026-05-28');
    expect(weeks).toHaveLength(53);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it('places today inside the last column at its weekday row', () => {
    // 2026-05-28 is a Thursday → row 4 (Sun=0).
    const today = '2026-05-28';
    const dayOfWeek = fromIsoDate(today).getDay();
    const { weeks } = buildYearGrid(today);
    expect(weeks[52][dayOfWeek]).toBe(today);
  });

  it('first cell is the Sunday 53 weeks before the last Saturday', () => {
    const today = '2026-05-28'; // Thursday
    const { weeks } = buildYearGrid(today);
    // Last Saturday of the grid = today + (6 - 4) = today + 2 days.
    const lastSaturday = addDays(today, 2);
    // First Sunday = lastSaturday - 370 days (53*7 - 1).
    const expectedFirst = addDays(lastSaturday, -(53 * 7 - 1));
    expect(weeks[0][0]).toBe(expectedFirst);
  });

  it('rows are consecutive days within a column', () => {
    const { weeks } = buildYearGrid('2026-05-28');
    for (const week of weeks) {
      for (let i = 1; i < 7; i++) {
        expect(week[i]).toBe(addDays(week[i - 1], 1));
      }
    }
  });

  it('columns are spaced exactly 7 days apart', () => {
    const { weeks } = buildYearGrid('2026-05-28');
    for (let c = 1; c < 53; c++) {
      expect(weeks[c][0]).toBe(addDays(weeks[c - 1][0], 7));
    }
  });

  it('emits a month label at each month boundary', () => {
    const { monthLabels } = buildYearGrid('2026-05-28');
    // 53 weeks ≈ 371 days, so the grid wraps around: the starting month and
    // the ending month can be the same (e.g. May 2025 … May 2026 → 13 labels).
    // Labels with <3 cols of width are dropped to prevent overlap at the
    // edges, so the count lands between ~11 and ~13 depending on weekday.
    expect(monthLabels.length).toBeGreaterThanOrEqual(11);
    expect(monthLabels.length).toBeLessThanOrEqual(13);
  });

  it('month labels are emitted at strictly increasing columns', () => {
    const { monthLabels } = buildYearGrid('2026-05-28');
    for (let i = 1; i < monthLabels.length; i++) {
      expect(monthLabels[i].col).toBeGreaterThan(monthLabels[i - 1].col);
    }
  });

  it('month labels are valid 3-letter month abbreviations', () => {
    const { monthLabels } = buildYearGrid('2026-05-28');
    const valid = new Set([
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]);
    for (const { label } of monthLabels) {
      expect(valid.has(label)).toBe(true);
    }
  });

  it('works when today is itself a Sunday (row 0 of last column)', () => {
    // Find a known Sunday: 2026-05-31 is a Sunday.
    const today = '2026-05-31';
    expect(fromIsoDate(today).getDay()).toBe(0);
    const { weeks } = buildYearGrid(today);
    expect(weeks[52][0]).toBe(today);
  });

  it('works when today is a Saturday (row 6 of last column)', () => {
    // 2026-05-30 is a Saturday.
    const today = '2026-05-30';
    expect(fromIsoDate(today).getDay()).toBe(6);
    const { weeks } = buildYearGrid(today);
    expect(weeks[52][6]).toBe(today);
  });
});
