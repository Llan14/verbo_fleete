"use client";

import type { CalendarTask } from "./types";

interface CalendarDayCellProps {
  type: "empty" | "day";
  date?: Date;
  tasks?: CalendarTask[];
  onSelectTask?: (task: CalendarTask) => void;
}

export default function CalendarDayCell({
  type,
  date,
  tasks = [],
  onSelectTask,
}: CalendarDayCellProps) {
  if (type === "empty" || !date) {
    return <div className="min-h-[110px] bg-slate-100/50 dark:bg-slate-950/20 border-r border-b border-slate-200/80 dark:border-white/5" />;
  }

  const isToday =
    new Date().toDateString() === date.toDateString();

  return (
    <div
      className={`min-h-[110px] p-2 border-r border-b border-slate-200/80 dark:border-white/10 transition-colors flex flex-col justify-between ${
        isToday 
          ? "bg-sky-500/10 dark:bg-sky-500/10" 
          : "bg-white/50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
            isToday
              ? "bg-sky-500 text-white shadow-md shadow-sky-950/30"
              : "text-slate-700 dark:text-slate-300"
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="mt-2 space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onSelectTask?.(task)}
            className="w-full text-left truncate rounded-lg bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 px-2 py-1 text-[11px] font-semibold text-sky-800 dark:text-sky-200 hover:bg-sky-500/20 dark:hover:bg-sky-500/30 hover:text-sky-950 dark:hover:text-white transition-all cursor-pointer block"
            title={task.titulo}
          >
            • {task.titulo}
          </button>
        ))}
      </div>
    </div>
  );
}