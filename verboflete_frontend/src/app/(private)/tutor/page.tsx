"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect } from "react";
import {
  getTeacherAssignmentResults,
  listTeacherAssignments,
} from "@/services/aiAssignmentsService";
import {
  TeacherAssignmentListItem,
  TeacherAssignmentResultsResponse,
} from "@/types/aiAssignments";
import { GlassCard } from "@/components/GlassCard";

export default function TutorPage() {
  const [assignments, setAssignments] = useState<TeacherAssignmentListItem[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [results, setResults] = useState<TeacherAssignmentResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const fetchedAssignments = await listTeacherAssignments();
      setAssignments(fetchedAssignments);

      if (fetchedAssignments.length > 0) {
        const initialId = selectedAssignmentId ?? fetchedAssignments[0].assignment_id;
        setSelectedAssignmentId(initialId);
        await loadResults(initialId);
      } else {
        setResults(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el panel de docente.");
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (assignmentId: number) => {
    setLoadingResults(true);
    setError("");
    try {
      const data = await getTeacherAssignmentResults(assignmentId);
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las evaluaciones.");
      setResults(null);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Vista de Profesor</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Seguimiento de evaluaciones y calificaciones por tarea.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-4 text-sm text-rose-800 dark:text-rose-200 backdrop-blur-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-white">Tareas del grupo</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No hay tareas con evaluaciones aún.</p>
          ) : (
            <div className="space-y-2.5">
              {assignments.map((assignment) => {
                const active = assignment.assignment_id === selectedAssignmentId;
                return (
                  <button
                    key={assignment.assignment_id}
                    onClick={async () => {
                      setSelectedAssignmentId(assignment.assignment_id);
                      await loadResults(assignment.assignment_id);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition cursor-pointer shadow-sm ${
                      active
                        ? "border-sky-500 bg-sky-500/10 dark:border-sky-400 dark:bg-sky-500/20"
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{assignment.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {assignment.module} · {assignment.group_name}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Enviadas: {assignment.submitted_count}/{assignment.recipients_count}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-white">Calificaciones</h2>
          {!selectedAssignmentId || !results ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona una tarea para ver las evaluaciones de los alumnos.</p>
          ) : loadingResults ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Cargando evaluaciones...</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-950/40 p-4">
                <p className="font-bold text-slate-900 dark:text-white">{results.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {results.module} · {results.group_name} · entrega {new Date(results.due_at).toLocaleDateString("es-ES")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white dark:bg-white/10 px-2.5 py-1 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
                    Enviadas: {results.submitted_count}/{results.recipients_count}
                  </span>
                  <span className="rounded-full bg-white dark:bg-white/10 px-2.5 py-1 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
                    Promedio: {results.average_score ?? "-"}
                  </span>
                  <span className="rounded-full bg-white dark:bg-white/10 px-2.5 py-1 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
                    Ponderación: {results.weight}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                <div className="grid grid-cols-[1.3fr_1.4fr_0.8fr_1fr] bg-slate-100 dark:bg-slate-950/60 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                  <span>Alumno</span>
                  <span>Email</span>
                  <span>Estado</span>
                  <span>Nota</span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-white/5 bg-white/50 dark:bg-transparent">
                  {results.recipients.map((recipient) => (
                    <div key={recipient.recipient_id} className="grid grid-cols-[1.3fr_1.4fr_0.8fr_1fr] px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                      <span className="font-semibold text-slate-900 dark:text-white">{recipient.student_name}</span>
                      <span className="truncate pr-3">{recipient.student_email}</span>
                      <span className="uppercase text-xs font-bold">{recipient.status}</span>
                      <span className="font-black text-sky-600 dark:text-sky-400">{recipient.score ?? "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}