import { scaleQuantize } from 'd3-scale';

export type IntensityLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Build a function that buckets a per-day count into 5 intensity levels.
 *
 * - `count === 0` always maps to level 0 (empty cell).
 * - `count >= 1` is distributed across levels 1..4 using a d3 quantize scale
 *   over the domain `[1, maxCount]`. When `maxCount <= 1` everything non-zero
 *   collapses to level 4 — a single marked day deserves the strongest tone.
 * - `maxCount === 0` returns a function that always yields 0 (no marks yet).
 */
export function buildIntensityScale(maxCount: number): (count: number) => IntensityLevel {
  if (maxCount <= 0) {
    return () => 0;
  }
  if (maxCount === 1) {
    return (count) => (count > 0 ? 4 : 0);
  }
  const scale = scaleQuantize<IntensityLevel>().domain([1, maxCount]).range([1, 2, 3, 4]);
  return (count) => {
    if (count <= 0) return 0;
    return scale(count);
  };
}

const LEVEL_PERCENT: Record<IntensityLevel, number> = {
  0: 0,
  1: 25,
  2: 50,
  3: 75,
  4: 100,
};

/**
 * Return a CSS color string for a given intensity level. Level 0 is fully
 * transparent (the cell renders empty); levels 1..4 mix the base color with
 * transparent in 25% steps using `color-mix(in oklch, ...)`. Works in both
 * light and dark mode without recomputing the palette.
 */
export function intensityColor(level: IntensityLevel, baseColor: string): string {
  const pct = LEVEL_PERCENT[level];
  if (pct === 0) return 'transparent';
  return `color-mix(in oklch, ${baseColor} ${pct}%, transparent)`;
}
