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
              className="min-h-[100px] border-r border-b border-slate-200 bg-slate-50/40"
            />
          );
        }

        const date = cell.date as Date;
        const key = formatDateKey(date);
        const tasks = tasksByDay.get(key) ?? [];

        return (
          <CalendarDayCell
            key={`${key}-${index}`}
            date={date}
            tasks={tasks}
            onSelectTask={onSelectTask}
          />
        );
      })}
    </div>
  );
}
