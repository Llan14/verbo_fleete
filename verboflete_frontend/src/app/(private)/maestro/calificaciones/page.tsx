"use client";

import { useEffect, useMemo, useState } from "react";
import { getTeacherGradesByGroup, getTutorGroups } from "@/services/aiAssignmentsService";
import { TeacherGradesByGroupItem, TutorGroup } from "@/types/aiAssignments";
import { GlassCard } from "@/components/GlassCard";

export default function MaestroCalificacionesPage() {
  const [groups, setGroups] = useState<TutorGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [resultados, setResultados] = useState<TeacherGradesByGroupItem[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      setError("");
      try {
        const data = await getTutorGroups();
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar tus grupos.");
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    const loadGrades = async () => {
      if (!selectedGroupId) {
        setResultados([]);
        return;
      }

      setLoadingResults(true);
      setError("");
      try {
        const data = await getTeacherGradesByGroup(selectedGroupId);
        setResultados(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las calificaciones.");
      } finally {
        setLoadingResults(false);
      }
    };

    loadGrades();
  }, [selectedGroupId]);

  const totalEntregas = useMemo(() => {
    return resultados.reduce((acc, tarea) => acc + tarea.entregas.length, 0);
  }, [resultados]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans animate-in fade-in duration-500">
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Calificaciones</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Consulta el desempeño de tus estudiantes por grupo.</p>
      </div>

      <GlassCard className="p-6">
        <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-400">Grupo</label>
        <select
          disabled={loadingGroups || groups.length === 0}
          value={selectedGroupId ?? ""}
          onChange={(event) => setSelectedGroupId(Number(event.target.value))}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white font-medium outline-none focus:border-sky-500 dark:focus:border-sky-400 cursor-pointer text-sm shadow-sm"
        >
          {groups.length === 0 ? (
            <option value="">Sin grupos asignados</option>
          ) : (
            groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nombre}
              </option>
            ))
          )}
        </select>
        <p className="mt-3 text-xs font-semibold text-sky-600 dark:text-sky-300">
          Tareas: {resultados.length} · Entregas registradas: {totalEntregas}
        </p>
      </GlassCard>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-4 text-sm text-rose-800 dark:text-rose-200 backdrop-blur-md">{error}</div>}

      {loadingResults ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center text-slate-600 dark:text-slate-300">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent" />
          <p className="mt-3 text-xs font-semibold">Cargando calificaciones...</p>
        </div>
      ) : resultados.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No hay datos de calificaciones para este grupo.</p>
        </GlassCard>
      ) : (
        resultados.map((tarea) => (
          <GlassCard key={tarea.tarea_id} className="p-6">
            <h2 className="border-b border-slate-200 dark:border-white/10 pb-3 text-xl font-black text-slate-900 dark:text-white">{tarea.titulo}</h2>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr_1.4fr] bg-slate-100 dark:bg-slate-950/60 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                <span>ID Alumno</span>
                <span>Alumno</span>
                <span>Calificación</span>
                <span>Notas / Errores</span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/5 bg-white/50 dark:bg-transparent">
                {tarea.entregas.map((entrega) => (
                  <div key={`${tarea.tarea_id}-${entrega.alumno_id}`} className="grid grid-cols-[0.8fr_1.4fr_0.8fr_1.4fr] px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                    <span>{entrega.alumno_id}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{entrega.alumno_nombre}</span>
                    <span className="font-black text-sky-600 dark:text-sky-400">{entrega.calificacion ?? "-"}</span>
                    <span className="text-xs text-rose-700 dark:text-rose-300">{entrega.errores_frecuentes ?? "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}