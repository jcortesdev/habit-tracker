import type { Entry, Habit } from '@/lib/types';
import { HabitRow } from './habit-row';

interface HabitListProps {
  habits: Habit[];
  entries: Entry[];
  today: string;
}

export function HabitList({ habits, entries, today }: HabitListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {habits.map((habit) => (
        <HabitRow key={habit.id} habit={habit} entries={entries} today={today} />
      ))}
    </ul>
  );
}
