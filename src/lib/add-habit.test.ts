import { describe, expect, it } from 'vitest';
import { addHabit } from './add-habit';

describe('addHabit', () => {
  it('returns a Habit with a uuid, trimmed name, color, and createdAt', () => {
    const habit = addHabit({ name: '  Read  ', color: '#22c55e', now: 1700000000000 });
    expect(habit.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(habit.name).toBe('Read');
    expect(habit.color).toBe('#22c55e');
    expect(habit.createdAt).toBe(1700000000000);
  });

  it('defaults createdAt to Date.now when not provided', () => {
    const before = Date.now();
    const habit = addHabit({ name: 'Meditate', color: '#3b82f6' });
    const after = Date.now();
    expect(habit.createdAt).toBeGreaterThanOrEqual(before);
    expect(habit.createdAt).toBeLessThanOrEqual(after);
  });

  it('rejects an empty or whitespace-only name', () => {
    expect(() => addHabit({ name: '', color: '#000' })).toThrow();
    expect(() => addHabit({ name: '   ', color: '#000' })).toThrow();
  });

  it('produces a fresh uuid per call', () => {
    const a = addHabit({ name: 'a', color: '#000' });
    const b = addHabit({ name: 'b', color: '#000' });
    expect(a.id).not.toBe(b.id);
  });
});
