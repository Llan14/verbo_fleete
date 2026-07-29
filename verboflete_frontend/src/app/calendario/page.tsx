"use client";

import { getClientToken } from "@/lib/authToken";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CalendarGrid from "../../components/calendario/CalendarGrid";
import CalendarHeader from "../../components/calendario/CalendarHeader";
import type { CalendarTask } from "../../components/calendario/types";
import TareaModal from "../../components/TareaModal";
import { GlassCard } from "@/components/GlassCard";

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
  const router = useRouter();
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
        const token = getClientToken();

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

  const volverEnApp = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard/");
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent" />
        <p className="font-medium text-sm">Cargando calendario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-6 font-sans">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-4 text-center text-rose-800 dark:text-rose-200 backdrop-blur-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl font-sans animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-start">
        <button
          onClick={volverEnApp}
          className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white backdrop-blur-md cursor-pointer shadow-sm"
        >
          ← Volver
        </button>
      </div>

      <CalendarHeader
        monthLabel={monthLabel}
        onPreviousMonth={() => cambiarMes(-1)}
        onNextMonth={() => cambiarMes(1)}
      />

      <GlassCard className="p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-950/60">
          {diasSemana.map((dia) => (
            <div key={dia} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              {dia}
            </div>
          ))}
        </div>

        <CalendarGrid
          cells={diasCalendar}
          tasksByDay={tareasAgrupadas}
          onSelectTask={setTareaSeleccionada}
        />
      </GlassCard>

      {tareas.length === 0 && !loading && (
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No tienes tareas programadas en este calendario por el momento.</p>
        </GlassCard>
      )}

      {tareaSeleccionada && (
        <TareaModal tarea={tareaSeleccionada} onClose={() => setTareaSeleccionada(null)} />
      )}
    </div>
  );
}