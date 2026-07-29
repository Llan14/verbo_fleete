"use client";

import { getClientToken } from "@/lib/authToken";
import { useEffect, useState } from "react";
import ExerciseAssignmentRenderer from "@/components/exercises/ExerciseAssignmentRenderer";
import {
  getStudentAssignmentDetail,
  listStudentAssignments,
} from "@/services/aiAssignmentsService";
import { StudentAssignmentDetail, StudentAssignmentListItem } from "@/types/aiAssignments";
import { GlassCard } from "@/components/GlassCard";

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
    <div className="mx-auto max-w-6xl space-y-6 font-sans animate-in fade-in duration-500">
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Vista de Alumno</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Aquí solo resuelves tareas asignadas por tus profesores y recibes evaluación.</p>
      </div>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-4 text-sm text-rose-800 dark:text-rose-200 backdrop-blur-md">{error}</div>}
      {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-200 backdrop-blur-md">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-6">
          <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-white">Mis tareas</h2>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Cargando tareas...</p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No tienes tareas asignadas.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <button
                  key={assignment.recipient_id}
                  onClick={() => openAssignment(assignment.assignment_id)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 p-4 text-left transition hover:border-sky-500/40 dark:hover:border-sky-400/40 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{assignment.title}</p>
                    <span className="rounded-full bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-200">
                      {assignment.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {assignment.module} · {assignment.group_name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Entrega: {formatDueDate(assignment.due_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-white">Resolver tarea</h2>
          {!selectedAssignment ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona una tarea para ver el contenido y enviar tu respuesta.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedAssignment.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {selectedAssignment.module} · {selectedAssignment.group_name}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Vence: {new Date(selectedAssignment.due_at).toLocaleString("es-ES")}
                </p>
                {selectedAssignment.instructions && (
                  <p className="mt-3 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 p-3 text-sm text-slate-800 dark:text-slate-200">{selectedAssignment.instructions}</p>
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
        </GlassCard>
      </div>
    </div>
  );
}