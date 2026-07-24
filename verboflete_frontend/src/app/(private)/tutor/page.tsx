"use client";

import { useEffect, useState } from "react";

import {
  getTeacherAssignmentResults,
  listTeacherAssignments,
} from "@/services/aiAssignmentsService";
import {
  TeacherAssignmentListItem,
  TeacherAssignmentResultsResponse,
} from "@/types/aiAssignments";

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
      <div className="flex min-h-[70vh] items-center justify-center text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-menu-active border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-black text-primary">Vista de Profesor</h1>
        <p className="text-sm text-slate-600">
          Seguimiento de evaluaciones y calificaciones por tarea.
        </p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-black text-primary">Tareas del grupo</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-600">No hay tareas con evaluaciones aún.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => {
                const active = assignment.assignment_id === selectedAssignmentId;
                return (
                  <button
                    key={assignment.assignment_id}
                    onClick={async () => {
                      setSelectedAssignmentId(assignment.assignment_id);
                      await loadResults(assignment.assignment_id);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold text-slate-800">{assignment.title}</p>
                    <p className="text-xs text-slate-600">
                      {assignment.module} · {assignment.group_name}
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      Enviadas: {assignment.submitted_count}/{assignment.recipients_count}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-black text-primary">Calificaciones</h2>
          {!selectedAssignmentId || !results ? (
            <p className="text-sm text-slate-600">Selecciona una tarea para ver las evaluaciones de los alumnos.</p>
          ) : loadingResults ? (
            <p className="text-sm text-slate-600">Cargando evaluaciones...</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-bold text-slate-800">{results.title}</p>
                <p className="text-xs text-slate-600">
                  {results.module} · {results.group_name} · entrega {new Date(results.due_at).toLocaleDateString("es-ES")}
                </p>
                <div className="mt-2 flex gap-2 text-xs font-semibold text-slate-700">
                  <span className="rounded-full bg-white px-2 py-1 border border-slate-200">
                    Enviadas: {results.submitted_count}/{results.recipients_count}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 border border-slate-200">
                    Promedio: {results.average_score ?? "-"}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 border border-slate-200">
                    Ponderación: {results.weight}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1.3fr_1.4fr_0.8fr_1fr] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-600">
                  <span>Alumno</span>
                  <span>Email</span>
                  <span>Estado</span>
                  <span>Nota</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {results.recipients.map((recipient) => (
                    <div key={recipient.recipient_id} className="grid grid-cols-[1.3fr_1.4fr_0.8fr_1fr] px-4 py-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-800">{recipient.student_name}</span>
                      <span className="truncate pr-3">{recipient.student_email}</span>
                      <span className="uppercase text-xs font-bold">{recipient.status}</span>
                      <span className="font-black text-primary">{recipient.score ?? "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        )}
        </section>
      </div>
    </div>
  );
}
