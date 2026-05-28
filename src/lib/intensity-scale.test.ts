import { describe, expect, it } from 'vitest';
import { buildIntensityScale, intensityColor } from './intensity-scale';

describe('buildIntensityScale', () => {
  it('always returns 0 when no marks exist (maxCount = 0)', () => {
    const scale = buildIntensityScale(0);
    expect(scale(0)).toBe(0);
    expect(scale(1)).toBe(0);
    expect(scale(99)).toBe(0);
  });

  it('collapses everything non-zero to level 4 when maxCount = 1', () => {
    const scale = buildIntensityScale(1);
    expect(scale(0)).toBe(0);
    expect(scale(1)).toBe(4);
  });

  it('distributes counts across levels 1..4 for maxCount = 4', () => {
    const scale = buildIntensityScale(4);
    expect(scale(0)).toBe(0);
    expect(scale(1)).toBe(1);
    expect(scale(2)).toBe(2);
    expect(scale(3)).toBe(3);
    expect(scale(4)).toBe(4);
  });

  it('caps the top of the range when count exceeds maxCount', () => {
    const scale = buildIntensityScale(3);
    expect(scale(99)).toBe(4);
  });

  it('treats negative counts as empty (level 0)', () => {
    const scale = buildIntensityScale(5);
    expect(scale(-1)).toBe(0);
  });

  it('uses the full 1..4 range for larger domains', () => {
    const scale = buildIntensityScale(10);
    const levels = [1, 3, 5, 7, 10].map(scale);
    // Should span from 1 up to 4 monotonically.
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
    }
    expect(levels[0]).toBe(1);
    expect(levels[levels.length - 1]).toBe(4);
  });
});

describe('intensityColor', () => {
  it('returns transparent for level 0', () => {
    expect(intensityColor(0, '#22c55e')).toBe('transparent');
  });

  it('mixes the base color in 25% steps for levels 1..4', () => {
    expect(intensityColor(1, '#22c55e')).toBe('color-mix(in oklch, #22c55e 25%, transparent)');
    expect(intensityColor(2, '#22c55e')).toBe('color-mix(in oklch, #22c55e 50%, transparent)');
    expect(intensityColor(3, '#22c55e')).toBe('color-mix(in oklch, #22c55e 75%, transparent)');
    expect(intensityColor(4, '#22c55e')).toBe('color-mix(in oklch, #22c55e 100%, transparent)');
  });

  it('passes through arbitrary base color strings verbatim', () => {
    expect(intensityColor(2, 'rgb(0 128 255)')).toBe(
      'color-mix(in oklch, rgb(0 128 255) 50%, transparent)'
    );
  });
});
