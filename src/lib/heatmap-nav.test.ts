import { describe, expect, it } from 'vitest';
import { buildYearGrid } from './build-year-grid';
import { getNextFocusedCell } from './heatmap-nav';
import { fromIsoDate } from './iso-date';

const TODAY = '2026-05-28'; // Thursday → dow 4
const { weeks } = buildYearGrid(TODAY);
const todayCol = 52;
const todayRow = fromIsoDate(TODAY).getDay(); // 4

describe('getNextFocusedCell', () => {
  it('ArrowLeft moves one column back (same weekday, -7 days)', () => {
    const next = getNextFocusedCell({ col: 10, row: 3 }, 'ArrowLeft', weeks, TODAY);
    expect(next).toEqual({ col: 9, row: 3 });
  });

  it('ArrowRight moves one column forward', () => {
    const next = getNextFocusedCell({ col: 10, row: 3 }, 'ArrowRight', weeks, TODAY);
    expect(next).toEqual({ col: 11, row: 3 });
  });

  it('ArrowUp moves one row up (same week, -1 day)', () => {
    const next = getNextFocusedCell({ col: 10, row: 3 }, 'ArrowUp', weeks, TODAY);
    expect(next).toEqual({ col: 10, row: 2 });
  });

  it('ArrowDown moves one row down', () => {
    const next = getNextFocusedCell({ col: 10, row: 3 }, 'ArrowDown', weeks, TODAY);
    expect(next).toEqual({ col: 10, row: 4 });
  });

  it('returns null at the left edge', () => {
    expect(getNextFocusedCell({ col: 0, row: 3 }, 'ArrowLeft', weeks, TODAY)).toBeNull();
  });

  it('returns null at the top edge', () => {
    expect(getNextFocusedCell({ col: 10, row: 0 }, 'ArrowUp', weeks, TODAY)).toBeNull();
  });

  it('returns null at the bottom edge', () => {
    expect(getNextFocusedCell({ col: 10, row: 6 }, 'ArrowDown', weeks, TODAY)).toBeNull();
  });

  it('Home jumps to col 0 in the same row', () => {
    const next = getNextFocusedCell({ col: 30, row: 2 }, 'Home', weeks, TODAY);
    expect(next).toEqual({ col: 0, row: 2 });
  });

  it('End jumps to the last column in the same row', () => {
    const next = getNextFocusedCell({ col: 5, row: 2 }, 'End', weeks, TODAY);
    expect(next).toEqual({ col: 52, row: 2 });
  });

  it('End on a row whose last column is in the future walks back', () => {
    // 2026-05-28 is Thursday (row 4). Last column rows 5/6 (Fri/Sat) are
    // still in the future relative to today.
    const next = getNextFocusedCell({ col: 5, row: 5 }, 'End', weeks, TODAY);
    expect(next).toEqual({ col: 51, row: 5 });
  });

  it('ArrowRight that would land on a future cell returns null', () => {
    // Today (Thu) lives at (52, 4). Right of it is column 53 → out of range.
    expect(getNextFocusedCell({ col: 52, row: 4 }, 'ArrowRight', weeks, TODAY)).toBeNull();
  });

  it('ArrowDown into a future cell returns null', () => {
    // (52, 4) is today (Thu). (52, 5) is Fri, future.
    expect(getNextFocusedCell({ col: 52, row: 4 }, 'ArrowDown', weeks, TODAY)).toBeNull();
  });

  it('today position is reachable via End from earlier columns', () => {
    const next = getNextFocusedCell({ col: 0, row: todayRow }, 'End', weeks, TODAY);
    expect(next).toEqual({ col: todayCol, row: todayRow });
  });

  it('returns null when the move does not change position', () => {
    // Home at col 0 → still col 0 → null.
    expect(getNextFocusedCell({ col: 0, row: 2 }, 'Home', weeks, TODAY)).toBeNull();
  });
});
