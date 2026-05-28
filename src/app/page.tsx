export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-md space-y-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Module 1 — PWA shell</p>
        <h1 className="text-3xl font-semibold tracking-tight">Habit Tracker</h1>
        <p className="text-zinc-600 leading-relaxed dark:text-zinc-400">
          Offline-first habit tracker with a GitHub-style yearly heatmap. The shell is installable.
          Habits, toggles, and the heatmap land in later modules.
        </p>
      </div>
    </main>
  );
}
