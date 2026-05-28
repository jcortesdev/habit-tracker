import { describe, expect, it } from 'vitest';
import { toggleEntry } from './toggle-entry';
import type { Entry } from './types';

const entry = (habitId: string, date: string, id = `${habitId}-${date}`): Entry => ({
  id,
  habitId,
  date,
});

describe('toggleEntry', () => {
  it('adds a new entry when none exists for that (habitId, date)', () => {
    const result = toggleEntry([], 'h1', '2026-05-01');
    expect(result.changed).toBe('added');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ habitId: 'h1', date: '2026-05-01' });
    expect(result.entries[0].id).toBeTruthy();
  });

  it('removes the matching entry when one exists', () => {
    const existing = [entry('h1', '2026-05-01'), entry('h2', '2026-05-01')];
    const result = toggleEntry(existing, 'h1', '2026-05-01');
    expect(result.changed).toBe('removed');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].habitId).toBe('h2');
  });

  it('is idempotent across two toggles', () => {
    const first = toggleEntry([], 'h1', '2026-05-01');
    const second = toggleEntry(first.entries, 'h1', '2026-05-01');
    expect(second.entries).toHaveLength(0);
  });

  it('does not mutate the input array', () => {
    const input: Entry[] = [entry('h1', '2026-05-01')];
    toggleEntry(input, 'h1', '2026-05-02');
    expect(input).toHaveLength(1);
  });
});
