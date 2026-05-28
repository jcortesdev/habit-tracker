'use client';

import { db } from '@/lib/db';
import type { Entry, Habit } from '@/lib/types';

interface HabitRowProps {
  habit: Habit;
  entries: Entry[];
  today: string;
}

export function HabitRow({ habit, entries, today }: HabitRowProps) {
  const doneToday = entries.some((e) => e.habitId === habit.id && e.date === today);

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
      <span className="text-sm font-medium">{habit.name}</span>
    </li>
  );
}
