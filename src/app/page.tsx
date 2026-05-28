'use client';

import { AddHabitForm } from '@/components/add-habit-form';
import { EmptyState } from '@/components/empty-state';
import { HabitList } from '@/components/habit-list';
import { Heatmap } from '@/components/heatmap';
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
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Habit Tracker</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Offline-first. Your data lives on this device.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {habits === undefined || entries === undefined ? null : habits.length === 0 ? (
        <>
          <AddHabitForm />
          <EmptyState />
        </>
      ) : (
        <>
          <Heatmap entries={entries} today={today} />
          <AddHabitForm />
          <HabitList habits={habits} entries={entries} today={today} />
        </>
      )}
    </main>
  );
}
