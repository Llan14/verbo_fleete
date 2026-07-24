import type { CalendarTask } from "./types";

interface CalendarDayCellProps {
  date: Date;
  tasks: CalendarTask[];
  onSelectTask: (task: CalendarTask) => void;
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarDayCell({
  date,
  tasks,
  onSelectTask,
}: CalendarDayCellProps) {
  const today = new Date();
  const isToday = isSameCalendarDay(date, today);

  return (
    <div className="min-h-[100px] border-r border-b border-slate-200 bg-white p-2 transition-colors hover:bg-slate-50">
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
            isToday ? "bg-teal-500 text-white" : "text-slate-700"
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            title={task.titulo}
            onClick={() => onSelectTask(task)}
            className="block w-full truncate rounded bg-blue-100 px-1.5 py-1 text-left text-[11px] font-semibold text-blue-800 hover:bg-blue-200"
          >
            {task.titulo}
          </button>
        ))}
      </div>
    </div>
  );
}
