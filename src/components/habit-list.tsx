import type { Habit } from '@/lib/types';

interface HabitListProps {
  habits: Habit[];
}

export function HabitList({ habits }: HabitListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {habits.map((habit) => (
        <li
          key={habit.id}
          className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
        >
          <span
            aria-hidden
            className="size-3 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <span className="text-sm font-medium">{habit.name}</span>
        </li>
      ))}
    </ul>
  );
}
