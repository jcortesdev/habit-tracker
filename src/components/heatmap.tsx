'use client';

import { buildYearGrid } from '@/lib/build-year-grid';
import { getYearMap } from '@/lib/get-year-map';
import { type NavKey, getNextFocusedCell } from '@/lib/heatmap-nav';
import { type IntensityLevel, buildIntensityScale, intensityColor } from '@/lib/intensity-scale';
import { fromIsoDate } from '@/lib/iso-date';
import type { Entry, Habit, IsoDate } from '@/lib/types';
import { timeFormat } from 'd3-time-format';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

const NAV_KEYS = new Set<NavKey>([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

const formatTooltipDate = timeFormat('%a, %b %d, %Y');

interface HeatmapProps {
  entries: Entry[];
  habits: Habit[];
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

// Neutral slate base for the "all habits" view. When a single habit is
// selected, its own color takes over.
const NEUTRAL_BASE = '#64748b';

const WEEKDAY_LABELS: { row: number; label: string }[] = [
  { row: 1, label: 'Mon' },
  { row: 3, label: 'Wed' },
  { row: 5, label: 'Fri' },
];

const LEGEND_LEVELS: IntensityLevel[] = [0, 1, 2, 3, 4];

interface HoveredCell {
  date: IsoDate;
  count: number;
  col: number;
  row: number;
}

export function Heatmap({ entries, habits, today }: HeatmapProps) {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<HoveredCell | null>(null);
  const tooltipId = useId();

  // Roving-tabindex focus: only one cell is in the tab order at a time.
  // Default to today's position (last column, today's weekday) so users
  // land on the most relevant cell first.
  const todayRow = fromIsoDate(today).getDay();
  const [focused, setFocused] = useState<{ col: number; row: number }>(() => ({
    col: COLS - 1,
    row: todayRow,
  }));
  const focusRef = useRef<SVGRectElement | null>(null);
  const wantsFocus = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `focused` is the trigger; the effect intentionally re-runs whenever it changes so the new cell can take focus
  useEffect(() => {
    if (wantsFocus.current) {
      focusRef.current?.focus();
      wantsFocus.current = false;
    }
  }, [focused]);

  const selectedHabit = useMemo(
    () => (selectedHabitId ? (habits.find((h) => h.id === selectedHabitId) ?? null) : null),
    [habits, selectedHabitId]
  );
  const baseColor = selectedHabit?.color ?? NEUTRAL_BASE;

  const { weeks, monthLabels } = useMemo(() => buildYearGrid(today), [today]);
  const yearMap = useMemo(() => getYearMap(entries, selectedHabitId), [entries, selectedHabitId]);

  const { toLevel, maxCount } = useMemo(() => {
    let m = 0;
    for (const v of Object.values(yearMap)) if (v > m) m = v;
    return { toLevel: buildIntensityScale(m), maxCount: m };
  }, [yearMap]);

  function handleCellKeyDown(e: React.KeyboardEvent<SVGRectElement>, col: number, row: number) {
    if (!NAV_KEYS.has(e.key as NavKey)) return;
    e.preventDefault();
    const next = getNextFocusedCell({ col, row }, e.key as NavKey, weeks, today);
    if (!next) return;
    wantsFocus.current = true;
    setFocused(next);
  }

  return (
    <section
      aria-labelledby="heatmap-heading"
      className="space-y-3 rounded-2xl border border-zinc-200/80 bg-surface p-4 shadow-sm shadow-zinc-900/[0.04] dark:border-zinc-800 dark:shadow-none"
    >
      <div className="flex items-baseline justify-between">
        <h2 id="heatmap-heading" className="text-sm font-semibold">
          Last year
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {maxCount === 0 ? 'No marks yet' : `Up to ${maxCount} per day`}
        </p>
      </div>

      {/* Drilldown chips */}
      <div
        role="radiogroup"
        aria-label="Filter heatmap by habit"
        className="-mx-1 flex flex-wrap gap-1.5 px-1"
      >
        <HabitChip
          label="All habits"
          selected={selectedHabitId === null}
          onSelect={() => setSelectedHabitId(null)}
        />
        {habits.map((h) => (
          <HabitChip
            key={h.id}
            label={h.name}
            color={h.color}
            selected={selectedHabitId === h.id}
            onSelect={() => setSelectedHabitId(h.id)}
          />
        ))}
      </div>

      <div className="relative">
        <div className="overflow-x-auto">
          <svg
            // biome-ignore lint/a11y/useSemanticElements: an <svg> can't become a <fieldset>; role=group (not an atomic img) keeps each labelled, keyboard-navigable cell exposed to assistive tech
            role="group"
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
                const isHovered = hovered?.date === date;
                const isFocused = focused.col === c && focused.row === r;
                return (
                  // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: cells use roving tabindex for keyboard nav; role=img supplies the per-cell accessible name that axe requires on a labelled <rect>
                  <rect
                    key={date}
                    role="img"
                    ref={isFocused ? focusRef : undefined}
                    x={x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    ry={2}
                    tabIndex={isFocused ? 0 : -1}
                    aria-label={label}
                    aria-describedby={isHovered ? tooltipId : undefined}
                    onKeyDown={(e) => handleCellKeyDown(e, c, r)}
                    onPointerDown={(e) => {
                      // SVG <rect> doesn't always receive focus on click in
                      // every browser; force it so the focus styling sticks.
                      (e.currentTarget as SVGRectElement).focus();
                    }}
                    onMouseEnter={() => setHovered({ date, count, col: c, row: r })}
                    onMouseLeave={() => setHovered((h) => (h?.date === date ? null : h))}
                    onFocus={() => {
                      setHovered({ date, count, col: c, row: r });
                      if (!isFocused) setFocused({ col: c, row: r });
                    }}
                    onBlur={() => setHovered((h) => (h?.date === date ? null : h))}
                    style={level === 0 ? undefined : { fill: intensityColor(level, baseColor) }}
                    className={
                      level === 0
                        ? 'fill-zinc-200 stroke-transparent outline-none hover:stroke-zinc-400 focus:stroke-zinc-900 dark:fill-zinc-800 dark:hover:stroke-zinc-500 dark:focus:stroke-zinc-100'
                        : 'stroke-black/5 outline-none hover:stroke-zinc-400 focus:stroke-zinc-900 dark:stroke-white/5 dark:hover:stroke-zinc-500 dark:focus:stroke-zinc-100'
                    }
                    strokeWidth={1.5}
                  />
                );
              })
            )}
          </svg>
        </div>

        {hovered &&
          (() => {
            // Anchor the tooltip horizontally so it never overflows the
            // outer wrapper. Near the left edge anchor at the cell's left
            // edge; near the right edge anchor at the cell's right edge;
            // otherwise center it over the cell.
            const isLeftEdge = hovered.col <= 3;
            const isRightEdge = hovered.col >= COLS - 4;
            const cellMidX = LEFT_GUTTER + hovered.col * STRIDE + CELL / 2;
            const cellRightX = LEFT_GUTTER + hovered.col * STRIDE + CELL;
            const cellLeftX = LEFT_GUTTER + hovered.col * STRIDE;
            const leftPct = isLeftEdge
              ? (cellLeftX / WIDTH) * 100
              : isRightEdge
                ? (cellRightX / WIDTH) * 100
                : (cellMidX / WIDTH) * 100;
            const translateX = isLeftEdge ? '0%' : isRightEdge ? '-100%' : '-50%';
            return (
              <div
                id={tooltipId}
                role="tooltip"
                style={{
                  left: `${leftPct}%`,
                  top: `${((TOP_GUTTER + hovered.row * STRIDE) / HEIGHT) * 100}%`,
                  transform: `translate(${translateX}, calc(-100% - 8px))`,
                }}
                className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg transition-opacity duration-100 motion-reduce:transition-none dark:bg-zinc-100 dark:text-zinc-900"
              >
                <div className="font-medium">{formatTooltipDate(fromIsoDate(hovered.date))}</div>
                <div className="text-zinc-300 dark:text-zinc-600">
                  {hovered.count === 0
                    ? 'Not marked'
                    : `${hovered.count} habit${hovered.count === 1 ? '' : 's'}`}
                </div>
              </div>
            );
          })()}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <span>Less</span>
        <div className="flex items-center gap-0.5">
          {LEGEND_LEVELS.map((lvl) => (
            <span
              key={lvl}
              aria-hidden
              style={lvl === 0 ? undefined : { backgroundColor: intensityColor(lvl, baseColor) }}
              className={`block size-3 rounded-sm ${lvl === 0 ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </section>
  );
}

interface HabitChipProps {
  label: string;
  color?: string;
  selected: boolean;
  onSelect: () => void;
}

function HabitChip({ label, color, selected, onSelect }: HabitChipProps) {
  return (
    <button
      type="button"
      // biome-ignore lint/a11y/useSemanticElements: chip group uses role=radio so the underlying control stays a button (keeps focus ring/text-truncate styling); semantics still satisfy the radiogroup
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 ${
        selected
          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900'
      }`}
    >
      {color && (
        <span
          aria-hidden
          style={{ backgroundColor: color }}
          className="block size-2 rounded-full"
        />
      )}
      <span className="max-w-[10rem] truncate">{label}</span>
    </button>
  );
}
