'use client';

import { buildYearGrid } from '@/lib/build-year-grid';
import { getYearMap } from '@/lib/get-year-map';
import { type IntensityLevel, buildIntensityScale, intensityColor } from '@/lib/intensity-scale';
import type { Entry, IsoDate } from '@/lib/types';
import { useMemo } from 'react';

interface HeatmapProps {
  entries: Entry[];
  today: IsoDate;
}

// Geometry — pure constants so the SVG viewBox is identical across renders.
const CELL = 12;
const GAP = 2;
const STRIDE = CELL + GAP; // 14
const COLS = 53;
const ROWS = 7;
const LEFT_GUTTER = 28;
const TOP_GUTTER = 18;
const WIDTH = LEFT_GUTTER + COLS * STRIDE - GAP + 2;
const HEIGHT = TOP_GUTTER + ROWS * STRIDE - GAP + 2;

// Neutral slate base for the "all habits" view. The per-habit drilldown
// (Task 5) will swap this for `habit.color`.
const NEUTRAL_BASE = '#64748b';

const WEEKDAY_LABELS: { row: number; label: string }[] = [
  { row: 1, label: 'Mon' },
  { row: 3, label: 'Wed' },
  { row: 5, label: 'Fri' },
];

const LEGEND_LEVELS: IntensityLevel[] = [0, 1, 2, 3, 4];

export function Heatmap({ entries, today }: HeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => buildYearGrid(today), [today]);
  const yearMap = useMemo(() => getYearMap(entries), [entries]);

  const { toLevel, maxCount } = useMemo(() => {
    let m = 0;
    for (const v of Object.values(yearMap)) if (v > m) m = v;
    return { toLevel: buildIntensityScale(m), maxCount: m };
  }, [yearMap]);

  return (
    <section aria-labelledby="heatmap-heading" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="heatmap-heading" className="text-sm font-semibold">
          Last year
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {maxCount === 0 ? 'No marks yet' : `Up to ${maxCount} per day`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label="Yearly activity heatmap"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          className="block min-w-[560px]"
        >
          <title>Yearly activity heatmap</title>

          {/* Month labels along the top */}
          {monthLabels.map(({ col, label }) => (
            <text
              key={`m-${col}`}
              x={LEFT_GUTTER + col * STRIDE}
              y={TOP_GUTTER - 6}
              className="fill-zinc-500 text-[9px] dark:fill-zinc-400"
            >
              {label}
            </text>
          ))}

          {/* Weekday labels on the left */}
          {WEEKDAY_LABELS.map(({ row, label }) => (
            <text
              key={`w-${row}`}
              x={0}
              y={TOP_GUTTER + row * STRIDE + CELL - 2}
              className="fill-zinc-500 text-[9px] dark:fill-zinc-400"
            >
              {label}
            </text>
          ))}

          {/* Day cells */}
          {weeks.map((week, c) =>
            week.map((date, r) => {
              if (date > today) return null;
              const count = yearMap[date] ?? 0;
              const level = toLevel(count);
              const x = LEFT_GUTTER + c * STRIDE;
              const y = TOP_GUTTER + r * STRIDE;
              const label =
                count === 0
                  ? `${date}: not marked`
                  : `${date}: ${count} habit${count === 1 ? '' : 's'} marked`;
              return (
                <rect
                  key={date}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  ry={2}
                  tabIndex={-1}
                  aria-label={label}
                  style={level === 0 ? undefined : { fill: intensityColor(level, NEUTRAL_BASE) }}
                  className={
                    level === 0
                      ? 'fill-zinc-200 dark:fill-zinc-800'
                      : 'stroke-black/5 dark:stroke-white/5'
                  }
                  strokeWidth={level === 0 ? 0 : 1}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span>Less</span>
        <div className="flex items-center gap-0.5">
          {LEGEND_LEVELS.map((lvl) => (
            <span
              key={lvl}
              aria-hidden
              style={lvl === 0 ? undefined : { backgroundColor: intensityColor(lvl, NEUTRAL_BASE) }}
              className={`block size-3 rounded-sm ${lvl === 0 ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </section>
  );
}
