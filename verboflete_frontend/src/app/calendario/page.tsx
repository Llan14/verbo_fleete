// src/app/calendario/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarGrid from "../../components/calendario/CalendarGrid";
import CalendarHeader from "../../components/calendario/CalendarHeader";
import type { CalendarTask } from "../../components/calendario/types";
import TareaModal from "../../components/TareaModal";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type TareasPorDia = Map<string, CalendarTask[]>;

function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getMonthStartWeekday(date: Date) {
  const dayIndex = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return dayIndex === 0 ? 6 : dayIndex - 1;
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function CalendarioPage() {
  const [tareas, setTareas] = useState<CalendarTask[]>([]);
  const [fechaActual, setFechaActual] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<CalendarTask | null>(null);

  useEffect(() => {
    const fetchTareas = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No estás autenticado. Debes iniciar sesión para ver el calendario.");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendario/tareas`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las tareas del calendario.");
        }

        const data: CalendarTask[] = await response.json();
        setTareas(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Ocurrió un error al cargar el calendario.");
      } finally {
        setLoading(false);
      }
    };

    fetchTareas();
  }, []);

  const mes = fechaActual.getMonth();
  const anio = fechaActual.getFullYear();
  const diasEnMes = getDaysInMonth(fechaActual);
  const offsetInicio = getMonthStartWeekday(fechaActual);
  const monthLabel = fechaActual.toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const tareasAgrupadas = useMemo<TareasPorDia>(() => {
    const mapa = new Map<string, CalendarTask[]>();

    tareas.forEach((tarea) => {
      const fechaTarea = new Date(tarea.fecha_entrega);
      const clave = formatDateKey(fechaTarea);
      const tareasExistentes = mapa.get(clave) ?? [];
      tareasExistentes.push(tarea);
      mapa.set(clave, tareasExistentes);
    });

    return mapa;
  }, [tareas]);

  const diasCalendar = useMemo(() => {
    const celdas: Array<{ type: "empty" | "day"; date?: Date }> = [];

    for (let i = 0; i < offsetInicio; i += 1) {
      celdas.push({ type: "empty" });
    }

    for (let dia = 1; dia <= diasEnMes; dia += 1) {
      celdas.push({
        type: "day",
        date: new Date(anio, mes, dia),
      });
    }

    const totalCeldas = celdas.length;
    const restante = (7 - (totalCeldas % 7)) % 7;

    for (let i = 0; i < restante; i += 1) {
      celdas.push({ type: "empty" });
    }

    return celdas;
  }, [anio, mes, diasEnMes, offsetInicio]);

  const cambiarMes = (incremento: number) => {
    setFechaActual((prev) => addMonths(prev, incremento));
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        <p className="font-medium">Cargando calendario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <CalendarHeader
        monthLabel={monthLabel}
        onPreviousMonth={() => cambiarMes(-1)}
        onNextMonth={() => cambiarMes(1)}
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {diasSemana.map((dia) => (
            <div key={dia} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
              {dia}
            </div>
          ))}
        </div>

        <CalendarGrid
          cells={diasCalendar}
          tasksByDay={tareasAgrupadas}
          onSelectTask={setTareaSeleccionada}
        />
      </div>

      {tareas.length === 0 && !loading && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-600">
          No tienes tareas programadas en este calendario por el momento.
        </div>
      )}

      {tareaSeleccionada && (
        <TareaModal tarea={tareaSeleccionada} onClose={() => setTareaSeleccionada(null)} />
      )}
    </div>
  );
}