import { getYearMap } from '@/lib/get-year-map';
import { addDays } from '@/lib/iso-date';
import type { Entry } from '@/lib/types';

interface MiniBarProps {
  entries: Entry[];
  habitId: string;
  color: string;
  today: string;
}

/**
 * Seven cells showing the last 7 days for one habit. Today on the right,
 * six days ago on the left. Acts as a tiny preview of the Module 4 heatmap.
 */
export function MiniBar({ entries, habitId, color, today }: MiniBarProps) {
  const yearMap = getYearMap(entries, habitId);
  const days: { date: string; done: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    days.push({ date, done: (yearMap[date] ?? 0) > 0 });
  }
  const doneCount = days.filter((d) => d.done).length;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Last 7 days: ${doneCount} of 7 marked`}
      role="img"
    >
      {days.map(({ date, done }) => (
        <span
          key={date}
          title={date}
          aria-hidden
          style={{
            backgroundColor: done ? color : `color-mix(in oklch, ${color} 14%, transparent)`,
          }}
          className="block size-3 rounded-sm"
        />
      ))}
    </div>
  );
}
