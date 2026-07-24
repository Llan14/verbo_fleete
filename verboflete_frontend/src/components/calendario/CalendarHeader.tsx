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
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Mes Anterior
        </button>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold capitalize text-slate-800">
          {monthLabel}
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Mes Siguiente
        </button>
      </div>
    </div>
  );
}
