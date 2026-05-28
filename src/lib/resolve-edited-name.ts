/**
 * Decide what name to commit when an inline edit finishes.
 * Whitespace-only drafts revert to the original — empty habit names
 * are rejected at every other entry point and shouldn't slip in here.
 */
export function resolveEditedName(draft: string, original: string): string {
  const trimmed = draft.trim();
  if (trimmed.length === 0) return original;
  return trimmed;
}
