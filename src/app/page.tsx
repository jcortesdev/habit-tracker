'use client';

import { AddHabitForm } from '@/components/add-habit-form';
import { EmptyState } from '@/components/empty-state';
import { HabitList } from '@/components/habit-list';
import { toIsoDate } from '@/lib/iso-date';
import { useEntries } from '@/lib/use-entries';
import { useHabits } from '@/lib/use-habits';

export default function Home() {
  const habits = useHabits();
  const entries = useEntries();
  const today = toIsoDate(new Date());

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Habit Tracker</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Offline-first. Your data lives on this device.
        </p>
      </header>

      <AddHabitForm />

      {habits === undefined || entries === undefined ? null : habits.length === 0 ? (
        <EmptyState />
      ) : (
        <HabitList habits={habits} entries={entries} today={today} />
      )}
    </main>
  );
}
