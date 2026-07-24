"use client";

import { getClientToken } from "@/lib/authToken";
import { useEffect, useState } from "react";

import ExerciseAssignmentRenderer from "@/components/exercises/ExerciseAssignmentRenderer";
import {
  getStudentAssignmentDetail,
  listStudentAssignments,
} from "@/services/aiAssignmentsService";
import { StudentAssignmentDetail, StudentAssignmentListItem } from "@/types/aiAssignments";

export default function TareasAlumnoPage() {
  const [assignments, setAssignments] = useState<StudentAssignmentListItem[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignmentDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const formatDueDate = (dueAt: string) =>
    new Date(dueAt).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const loadAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listStudentAssignments();
      setAssignments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus tareas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const openAssignment = async (assignmentId: number) => {
    setError("");
    setMessage("");
    try {
      const detail = await getStudentAssignmentDetail(assignmentId);
      setSelectedAssignment(detail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la tarea.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-black text-primary">Vista de Alumno</h1>
        <p className="text-sm text-slate-600">Aquí solo resuelves tareas asignadas por tus profesores y recibes evaluación.</p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-black text-primary">Mis tareas</h2>
          {loading ? (
            <p className="text-sm text-slate-600">Cargando tareas...</p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-slate-600">No tienes tareas asignadas.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <button
                  key={assignment.recipient_id}
                  onClick={() => openAssignment(assignment.assignment_id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{assignment.title}</p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-primary">
                      {assignment.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {assignment.module} · {assignment.group_name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    Entrega: {formatDueDate(assignment.due_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-black text-primary">Resolver tarea</h2>
          {!selectedAssignment ? (
            <p className="text-sm text-slate-600">Selecciona una tarea para ver el contenido y enviar tu respuesta.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-lg font-bold text-slate-800">{selectedAssignment.title}</p>
                <p className="text-xs text-slate-600">
                  {selectedAssignment.module} · {selectedAssignment.group_name}
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  Vence: {new Date(selectedAssignment.due_at).toLocaleString("es-ES")}
                </p>
                {selectedAssignment.instructions && (
                  <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{selectedAssignment.instructions}</p>
                )}
              </div>

              <ExerciseAssignmentRenderer
                payload={selectedAssignment.payload}
                disabled={selectedAssignment.status === "submitted"}
                onSubmit={async (answersPayload, score) => {
                  const token = getClientToken();
                  const response = await fetch(`/api/student/assignments/${selectedAssignment.assignment_id}/submit`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      answers_payload: answersPayload,
                      score,
                    }),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.detail || "No se pudo enviar la tarea.");
                  }

                  const result = await response.json();
                  setMessage(`Tarea enviada correctamente. Envío #${result.submission_id}.`);
                  setSelectedAssignment((prev) => (prev ? { ...prev, status: "submitted" } : prev));
                  await loadAssignments();
                }}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
