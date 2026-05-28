'use client';

import { db } from '@/lib/db';
import { getStreak } from '@/lib/get-streak';
import type { Entry, Habit } from '@/lib/types';
import { MiniBar } from './mini-bar';

interface HabitRowProps {
  habit: Habit;
  entries: Entry[];
  today: string;
}

export function HabitRow({ habit, entries, today }: HabitRowProps) {
  const doneToday = entries.some((e) => e.habitId === habit.id && e.date === today);
  const streak = getStreak(entries, habit.id, today);

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

  async function handleDelete() {
    const ok = window.confirm(`Delete "${habit.name}"? Its history will be lost.`);
    if (!ok) return;
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
        <div className="truncate text-sm font-medium">{habit.name}</div>
        {streak > 0 && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{streak}-day streak</div>
        )}
      </div>

      <MiniBar entries={entries} habitId={habit.id} color={habit.color} today={today} />

      <button
        type="button"
        onClick={handleDelete}
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
    </li>
  );
}
