import type { IsoDate } from './types';

export interface CellPos {
  col: number;
  row: number;
}

export type NavKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

const ROWS = 7;

/**
 * Map an arrow / Home / End keypress into the next cell to focus inside a
 * heatmap grid. Returns `null` when the move would leave the grid or land
 * on a future date.
 *
 * Spatial mapping (the layout, not the calendar):
 * - `←` / `→` move ±1 column (= ±7 days, same weekday)
 * - `↑` / `↓` move ±1 row (= ±1 weekday, same week)
 * - `Home` / `End` jump to the first / last valid column in the row.
 *
 * Pure: takes the grid + today, returns a new position. The component owns
 * focus side-effects.
 */
export function getNextFocusedCell(
  current: CellPos,
  key: NavKey,
  weeks: IsoDate[][],
  today: IsoDate
): CellPos | null {
  const cols = weeks.length;
  let { col, row } = current;

  switch (key) {
    case 'ArrowLeft':
      col -= 1;
      break;
    case 'ArrowRight':
      col += 1;
      break;
    case 'ArrowUp':
      row -= 1;
      break;
    case 'ArrowDown':
      row += 1;
      break;
    case 'Home':
      col = 0;
      break;
    case 'End':
      col = cols - 1;
      break;
  }

  if (col < 0 || col >= cols || row < 0 || row >= ROWS) return null;

  // Skip future cells: walk back toward `current.col` until we find an
  // in-range cell. Only End triggers this in practice — the last column
  // contains future cells for any weekday past today.
  while (col >= 0 && col < cols && weeks[col][row] > today) {
    if (key === 'End' || key === 'ArrowLeft') col -= 1;
    else col += 1;
  }
  if (col < 0 || col >= cols) return null;
  if (weeks[col][row] > today) return null;

  if (col === current.col && row === current.row) return null;
  return { col, row };
}
