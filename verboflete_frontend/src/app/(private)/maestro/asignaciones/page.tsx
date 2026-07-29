"use client";

import { useEffect, useState } from "react";
import { deleteTeacherAssignment, listTeacherAssignments } from "@/services/aiAssignmentsService";
import { TeacherAssignmentListItem } from "@/types/aiAssignments";
import { GlassCard } from "@/components/GlassCard";

export default function MaestroAsignacionesPage() {
  const [assignments, setAssignments] = useState<TeacherAssignmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const data = await listTeacherAssignments();
        setAssignments(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar tus asignaciones.");
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const handleDelete = async (assignment: TeacherAssignmentListItem) => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar la tarea "${assignment.title}"? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) {
      return;
    }

    setDeletingId(assignment.assignment_id);
    setError("");
    setSuccess("");

    try {
      const response = await deleteTeacherAssignment(assignment.assignment_id);
      setAssignments((prev) => prev.filter((item) => item.assignment_id !== assignment.assignment_id));
      setSuccess(`Tarea eliminada (ID: ${response.assignment_id}).`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la tarea.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans animate-in fade-in duration-500">
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mis Asignaciones</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Listado de tareas publicadas en tus grupos.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-4 text-sm text-rose-800 dark:text-rose-200 backdrop-blur-md">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-200 backdrop-blur-md">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-slate-600 dark:text-slate-300">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent" />
          <p className="mt-3 text-xs font-semibold">Cargando asignaciones...</p>
        </div>
      ) : assignments.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">No tienes asignaciones creadas todavía.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {assignments.map((assignment) => (
            <GlassCard key={assignment.assignment_id} className="p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{assignment.title}</h2>
                <p className="mt-1 text-xs text-sky-600 dark:text-sky-300 font-semibold">{assignment.module} · {assignment.group_name}</p>
                <p className="mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Entrega: {new Date(assignment.due_at).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-950/40 px-3 py-1.5 backdrop-blur-md">
                    Enviadas: <strong className="text-sky-600 dark:text-sky-300">{assignment.submitted_count}</strong>/{assignment.recipients_count}
                  </span>
                  <span className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-950/40 px-3 py-1.5 backdrop-blur-md">
                    Peso: <strong className="text-sky-600 dark:text-sky-300">{assignment.weight}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
                <button
                  onClick={() => handleDelete(assignment)}
                  disabled={deletingId === assignment.assignment_id}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-200 transition hover:bg-rose-500/20 dark:hover:bg-rose-500/30 hover:text-rose-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {deletingId === assignment.assignment_id ? "Eliminando..." : "Eliminar tarea"}
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}