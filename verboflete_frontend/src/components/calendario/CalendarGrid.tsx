"use client";

import CalendarDayCell from "./CalendarDayCell";
import type { CalendarTask } from "./types";

interface CalendarGridProps {
  cells: Array<{ type: "empty" | "day"; date?: Date }>;
  tasksByDay: Map<string, CalendarTask[]>;
  onSelectTask: (task: CalendarTask) => void;
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function CalendarGrid({
  cells,
  tasksByDay,
  onSelectTask,
}: CalendarGridProps) {
  return (
    <div className="grid grid-cols-7">
      {cells.map((cell, index) => {
        if (cell.type === "empty") {
          return (
            <div
              key={`empty-${index}`}
              // Se sincronizan las alturas y colores adaptativos con los de CalendarDayCell
              className="min-h-[110px] border-r border-b border-slate-200/80 dark:border-white/5 bg-slate-100/50 dark:bg-slate-950/20"
            />
          );
        }

        const date = cell.date as Date;
        const key = formatDateKey(date);
        const tasks = tasksByDay.get(key) ?? [];

        return (
          <CalendarDayCell
            key={`${key}-${index}`}
            type="day"
            date={date}
            tasks={tasks}
            onSelectTask={onSelectTask}
          />
        );
      })}
    </div>
  );
}