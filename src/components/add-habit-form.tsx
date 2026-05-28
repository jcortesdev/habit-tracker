'use client';

import { addHabit } from '@/lib/add-habit';
import { db } from '@/lib/db';
import { useState } from 'react';

const PALETTE = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#f43f5e'] as const;

export function AddHabitForm() {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PALETTE[0]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const habit = addHabit({ name: trimmed, color });
    await db.habits.add(habit);
    setName('');
    setColor(PALETTE[0]);
  }

  const disabled = name.trim().length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          New habit
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Read for 20 minutes"
          maxLength={80}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-visible:border-zinc-100"
        />
      </label>

      <div className="flex items-center gap-3">
        <fieldset className="flex items-center gap-1.5">
          <legend className="sr-only">Color</legend>
          {PALETTE.map((c) => (
            <label key={c} className="cursor-pointer">
              <input
                type="radio"
                name="habit-color"
                value={c}
                checked={color === c}
                onChange={() => setColor(c)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                style={{ backgroundColor: c }}
                className="block size-6 rounded-full ring-offset-2 ring-offset-white transition peer-checked:ring-2 peer-checked:ring-zinc-900 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 dark:ring-offset-zinc-950 dark:peer-checked:ring-zinc-100"
              />
              <span className="sr-only">Color {c}</span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={disabled}
          className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
        >
          Add habit
        </button>
      </div>
    </form>
  );
}
