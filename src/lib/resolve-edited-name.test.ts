import { describe, expect, it } from 'vitest';
import { resolveEditedName } from './resolve-edited-name';

describe('resolveEditedName', () => {
  it('returns the trimmed draft when it has content', () => {
    expect(resolveEditedName('  Run  ', 'Read')).toBe('Run');
  });

  it('keeps the original when the draft is empty', () => {
    expect(resolveEditedName('', 'Read')).toBe('Read');
  });

  it('keeps the original when the draft is whitespace-only', () => {
    expect(resolveEditedName('   ', 'Read')).toBe('Read');
  });

  it('returns the original unchanged when the draft already matches', () => {
    expect(resolveEditedName('Read', 'Read')).toBe('Read');
  });
});
