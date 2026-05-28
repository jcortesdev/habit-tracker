import { addDays, fromIsoDate } from './iso-date';
import type { IsoDate } from './types';

export interface YearGrid {
  /** 53 columns × 7 rows (Sun..Sat) of ISO date strings. */
  weeks: IsoDate[][];
  /** Column indices where a new month label should appear. */
  monthLabels: { col: number; label: string }[];
}

const WEEKS = 53;
const DAYS_PER_WEEK = 7;
const MONTH_SHORT = [
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
];

/**
 * Build a 53-week × 7-day grid ending in the week that contains `today`.
 *
 * Week starts on Sunday (row 0). The last column is the week containing
 * `today`; cells past `today` are still valid ISO dates (the caller can
 * choose to hide future cells when rendering).
 *
 * Pure: takes a date string, returns a grid. No Dexie, no I/O.
 */
export function buildYearGrid(today: IsoDate): YearGrid {
  const todayDate = fromIsoDate(today);
  const dayOfWeek = todayDate.getDay(); // 0 = Sunday

  // Saturday of today's week (last cell of last column).
  const lastSaturday = addDays(today, 6 - dayOfWeek);
  // Sunday of the first column = 53 weeks back from the last Sunday.
  const firstSunday = addDays(lastSaturday, -(WEEKS * DAYS_PER_WEEK - 1));

  const weeks: IsoDate[][] = [];
  for (let col = 0; col < WEEKS; col++) {
    const week: IsoDate[] = [];
    for (let row = 0; row < DAYS_PER_WEEK; row++) {
      week.push(addDays(firstSunday, col * DAYS_PER_WEEK + row));
    }
    weeks.push(week);
  }

  // Collect raw month boundaries (column where a new month starts), then
  // drop any whose visible width is too small — that's what causes the
  // "MayJun" overlap when the grid begins mid-month.
  const MIN_LABEL_WIDTH = 3;
  const raw: { col: number; label: string }[] = [];
  let lastMonth = -1;
  for (let col = 0; col < WEEKS; col++) {
    const month = fromIsoDate(weeks[col][0]).getMonth();
    if (month !== lastMonth) {
      raw.push({ col, label: MONTH_SHORT[month] });
      lastMonth = month;
    }
  }

  const monthLabels = raw.filter((entry, i) => {
    const nextCol = i < raw.length - 1 ? raw[i + 1].col : WEEKS;
    return nextCol - entry.col >= MIN_LABEL_WIDTH;
  });

  return { weeks, monthLabels };
}
