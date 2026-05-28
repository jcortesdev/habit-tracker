'use client';

import { db } from '@/lib/db';
import { getStreak } from '@/lib/get-streak';
import { resolveEditedName } from '@/lib/resolve-edited-name';
import type { Entry, Habit } from '@/lib/types';
import { useRef, useState } from 'react';
import { ConfirmDialog } from './confirm-dialog';
import { MiniBar } from './mini-bar';

interface HabitRowProps {
  habit: Habit;
  entries: Entry[];
  today: string;
}

export function HabitRow({ habit, entries, today }: HabitRowProps) {
  const doneToday = entries.some((e) => e.habitId === habit.id && e.date === today);
  const streak = getStreak(entries, habit.id, today);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(habit.name);
  const cancelledRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function startEditing() {
    setDraft(habit.name);
    setEditing(true);
  }

  async function commit() {
    const next = resolveEditedName(draft, habit.name);
    setEditing(false);
    if (next !== habit.name) {
      await db.habits.update(habit.id, { name: next });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      setEditing(false);
    }
  }

  function handleBlur() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    commit();
  }

  async function handleToggle() {
    const existing = await db.entries.where('[habitId+date]').equals([habit.id, today]).first();
    if (existing) {
      await db.entries.delete(existing.id);
    } else {
      await db.entries.add({
        id: crypto.randomUUID(),
        habitId: habit.id,
        date: today,
      });
    }
  }

  async function handleConfirmDelete() {
    setConfirmOpen(false);
    await db.transaction('rw', db.habits, db.entries, async () => {
      await db.entries.where('habitId').equals(habit.id).delete();
      await db.habits.delete(habit.id);
    });
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={doneToday}
        aria-label={
          doneToday ? `Mark ${habit.name} as not done today` : `Mark ${habit.name} as done today`
        }
        style={doneToday ? { backgroundColor: habit.color, borderColor: habit.color } : undefined}
        className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 ${
          doneToday
            ? 'border-transparent'
            : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600'
        }`}
      >
        {doneToday && (
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className="size-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Done</title>
            <path d="M3.5 8.5l3 3 6-6" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            type="text"
            value={draft}
            // biome-ignore lint/a11y/noAutofocus: edit-on-click intentionally focuses the field
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            maxLength={80}
            aria-label="Habit name"
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm font-medium outline-none focus-visible:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-visible:border-zinc-100"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            aria-label={`Edit ${habit.name}`}
            className="block w-full cursor-text truncate rounded-sm text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
          >
            {habit.name}
          </button>
        )}
        {streak > 0 && !editing && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{streak}-day streak</div>
        )}
      </div>

      <MiniBar entries={entries} habitId={habit.id} color={habit.color} today={today} />

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete ${habit.name}`}
        className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Delete habit</title>
          <path d="M2.5 4h11M6 4V2.5h4V4m-4.5 0v9.5h5V4M6.5 6.5v5m3-5v5" />
        </svg>
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${habit.name}"?`}
        description="Its entire history will be removed from this device. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </li>
  );
}
