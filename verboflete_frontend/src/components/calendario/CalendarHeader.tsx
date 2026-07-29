"use client";

interface CalendarHeaderProps {
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export default function CalendarHeader({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4 mb-4">
      <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
        {monthLabel}
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={onPreviousMonth}
          className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white backdrop-blur-md cursor-pointer shadow-sm"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <button
          onClick={onNextMonth}
          className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white backdrop-blur-md cursor-pointer shadow-sm"
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>
    </div>
  );
}