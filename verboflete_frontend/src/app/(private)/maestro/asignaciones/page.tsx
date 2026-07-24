"use client";

import { useEffect, useState } from "react";

import { deleteTeacherAssignment, listTeacherAssignments } from "@/services/aiAssignmentsService";
import { TeacherAssignmentListItem } from "@/types/aiAssignments";

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
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-black text-primary">Mis Asignaciones</h1>
        <p className="text-sm text-slate-600">Listado de tareas publicadas en tus grupos.</p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-menu-active border-t-transparent" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No tienes asignaciones creadas todavía.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((assignment) => (
            <article key={assignment.assignment_id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-800">{assignment.title}</h2>
              <p className="mt-1 text-xs text-slate-600">{assignment.module} · {assignment.group_name}</p>
              <p className="mt-2 text-xs font-semibold text-slate-700">
                Entrega: {new Date(assignment.due_at).toLocaleDateString("es-ES")}
              </p>
              <div className="mt-3 flex gap-2 text-xs font-semibold text-slate-700">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  Enviadas: {assignment.submitted_count}/{assignment.recipients_count}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  Peso: {assignment.weight}
                </span>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleDelete(assignment)}
                  disabled={deletingId === assignment.assignment_id}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === assignment.assignment_id ? "Eliminando..." : "Eliminar tarea"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
