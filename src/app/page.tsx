'use client';

import { AddHabitForm } from '@/components/add-habit-form';
import { EmptyState } from '@/components/empty-state';
import { HabitList } from '@/components/habit-list';
import { Heatmap } from '@/components/heatmap';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { toIsoDate } from '@/lib/iso-date';
import { useEntries } from '@/lib/use-entries';
import { useHabits } from '@/lib/use-habits';

export default function Home() {
  const habits = useHabits();
  const entries = useEntries();
  const today = toIsoDate(new Date());

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-600/20 dark:from-emerald-500 dark:to-emerald-700"
          >
            <svg
              viewBox="0 0 16 16"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Habit Tracker</title>
              <path d="M3.5 8.5l3 3 6-6" />
            </svg>
          </span>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-semibold tracking-tight">Habit Tracker</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Offline-first. Your data lives on this device.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {habits === undefined || entries === undefined ? (
        <LoadingSkeleton />
      ) : habits.length === 0 ? (
        <>
          <AddHabitForm />
          <EmptyState />
        </>
      ) : (
        <>
          <Heatmap entries={entries} habits={habits} today={today} />
          <AddHabitForm />
          <HabitList habits={habits} entries={entries} today={today} />
        </>
      )}
    </main>
  );
}
