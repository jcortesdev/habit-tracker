'use client';

import { EmptyState } from '@/components/empty-state';
import { HabitList } from '@/components/habit-list';
import { useHabits } from '@/lib/use-habits';

export default function Home() {
  const habits = useHabits();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Habit Tracker</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Offline-first. Your data lives on this device.
        </p>
      </header>

      {habits === undefined ? null : habits.length === 0 ? (
        <EmptyState />
      ) : (
        <HabitList habits={habits} />
      )}
    </main>
  );
}
