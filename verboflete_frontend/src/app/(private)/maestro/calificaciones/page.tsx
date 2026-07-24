"use client";

import { useEffect, useMemo, useState } from "react";

import { getTeacherGradesByGroup, getTutorGroups } from "@/services/aiAssignmentsService";
import { TeacherGradesByGroupItem, TutorGroup } from "@/types/aiAssignments";

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
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-black text-primary">Calificaciones</h1>
        <p className="text-sm text-slate-600">Consulta el desempeño de tus estudiantes por grupo.</p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Grupo</label>
        <select
          disabled={loadingGroups || groups.length === 0}
          value={selectedGroupId ?? ""}
          onChange={(event) => setSelectedGroupId(Number(event.target.value))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-medium outline-none focus:border-teal-500"
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
        <p className="mt-3 text-xs font-semibold text-slate-600">
          Tareas: {resultados.length} · Entregas registradas: {totalEntregas}
        </p>
      </section>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {loadingResults ? (
        <div className="flex min-h-[35vh] items-center justify-center text-slate-600">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-menu-active border-t-transparent" />
        </div>
      ) : resultados.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No hay datos de calificaciones para este grupo.</div>
      ) : (
        resultados.map((tarea) => (
          <section key={tarea.tarea_id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="border-b border-slate-200 pb-2 text-xl font-black text-slate-800">{tarea.titulo}</h2>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr_1.4fr] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-600">
                <span>ID Alumno</span>
                <span>Alumno</span>
                <span>Calificación</span>
                <span>Notas / Errores</span>
              </div>
              <div className="divide-y divide-slate-200">
                {tarea.entregas.map((entrega) => (
                  <div key={`${tarea.tarea_id}-${entrega.alumno_id}`} className="grid grid-cols-[0.8fr_1.4fr_0.8fr_1.4fr] px-4 py-3 text-sm text-slate-700">
                    <span>{entrega.alumno_id}</span>
                    <span className="font-semibold text-slate-800">{entrega.alumno_nombre}</span>
                    <span className="font-black text-primary">{entrega.calificacion ?? "-"}</span>
                    <span className="text-xs text-rose-600">{entrega.errores_frecuentes ?? "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
