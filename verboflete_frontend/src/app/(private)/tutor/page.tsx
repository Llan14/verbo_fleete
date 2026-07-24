"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
}

interface GrupoConMiembros {
  id: number;
  nombre: string;
  descripcion?: string;
  alumnos: Usuario[];
  tutores: Usuario[];
}

interface DashboardState {
  totalAlumnos: number;
  tareasActivas: number;
  promedioGeneral: number;
}

export default function TutorPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [grupos, setGrupos] = useState<GrupoConMiembros[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>("");
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>("");
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fecha_entrega: "",
  });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Debes iniciar sesión para acceder al panel del tutor.");
          return;
        }

        const resMe = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resMe.ok) {
          throw new Error("No se pudo verificar tu sesión como tutor.");
        }

        const userData = await resMe.json();
        if (userData.rol !== "tutor") {
          setError("Este panel es exclusivo para usuarios con rol tutor.");
          return;
        }

        const resGrupos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos/mis-grupos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resGrupos.ok) {
          setUsuarios([]);
          setNotice("Todavía no tienes alumnos asignados o la relación de grupos no está disponible.");
          return;
        }

        const dataGrupos: GrupoConMiembros[] = await resGrupos.json();
        setGrupos(dataGrupos);

        const alumnosDesdeGrupos = dataGrupos.flatMap((grupo) => grupo.alumnos ?? []);
        const alumnosUnicos = alumnosDesdeGrupos.filter(
          (usuario, index, self) => self.findIndex((item) => item.id === usuario.id) === index
        );

        setUsuarios(alumnosUnicos);

        if (alumnosUnicos.length === 0) {
          setNotice("Aún no tienes alumnos asociados. Solicita al administrador que te asigne grupos o alumnos.");
        }
      } catch (err: unknown) {
        setUsuarios([]);
        setNotice("No se pudo cargar la lista de alumnos. Puedes seguir usando el calendario mientras se completa la asociación.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const alumnos = useMemo(() => usuarios, [usuarios]);

  const gruposDelAlumno = useMemo(() => {
    if (!alumnoSeleccionado) return [];

    const alumnoId = Number(alumnoSeleccionado);
    return grupos.filter((grupo) => grupo.alumnos.some((alumno) => alumno.id === alumnoId));
  }, [alumnoSeleccionado, grupos]);

  useEffect(() => {
    if (!alumnoSeleccionado) {
      setGrupoSeleccionado("");
      return;
    }

    const alumnoId = Number(alumnoSeleccionado);
    const primerGrupo = grupos.find((grupo) => grupo.alumnos.some((alumno) => alumno.id === alumnoId));
    setGrupoSeleccionado(primerGrupo ? String(primerGrupo.id) : "");
  }, [alumnoSeleccionado, grupos]);

  const dashboardStats: DashboardState = {
    totalAlumnos: alumnos.length,
    tareasActivas: 12,
    promedioGeneral: 86,
  };

  const handleAsignarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Debes iniciar sesión.");
      }

      if (!alumnoSeleccionado || !grupoSeleccionado) {
        throw new Error("Primero selecciona un alumno con grupo asignado.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tareas/grupo/${grupoSeleccionado}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: form.titulo,
          descripcion: form.descripcion,
          fecha_entrega: `${form.fecha_entrega}T00:00:00`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "No se pudo asignar la tarea al alumno.");
      }

      setForm({ titulo: "", descripcion: "", fecha_entrega: "" });
      setAlumnoSeleccionado("");
      setGrupoSeleccionado("");
      alert("Tarea asignada correctamente.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al asignar la tarea.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-menu-active border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black text-primary">Panel del Tutor</h1>
          <Link
            href="/calendario"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Volver al calendario
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          Asigna tareas, revisa el progreso y monitorea el rendimiento de los alumnos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Alumnos asignados" value={dashboardStats.totalAlumnos.toString()} />
        <StatCard label="Tareas activas" value={dashboardStats.tareasActivas.toString()} />
        <StatCard label="Promedio general" value={`${dashboardStats.promedioGeneral}%`} />
      </div>

      {notice && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Asignar tarea a alumno</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {grupos.length} grupo(s)
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleAsignarTarea}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Alumno</label>
              <select
                value={alumnoSeleccionado}
                onChange={(e) => setAlumnoSeleccionado(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                required
              >
                <option value="">Seleccione un alumno</option>
                {alumnos.map((alumno) => (
                  <option key={alumno.id} value={alumno.id}>
                    {alumno.nombre} {alumno.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Grupo</label>
              <select
                value={grupoSeleccionado}
                onChange={(e) => setGrupoSeleccionado(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                required
                disabled={!alumnoSeleccionado || gruposDelAlumno.length === 0}
              >
                <option value="">Seleccione un grupo</option>
                {gruposDelAlumno.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Título</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Ej. Redacción de verbos"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="Describe la actividad"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Fecha de entrega</label>
              <input
                type="date"
                value={form.fecha_entrega}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha_entrega: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                required
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-teal-600 px-4 py-2 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-70"
            >
              {enviando ? "Asignando..." : "Guardar tarea"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-primary">Seguimiento de alumnos</h2>
          <div className="space-y-3">
            {alumnos.map((alumno) => (
              <div key={alumno.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {alumno.nombre} {alumno.apellidos}
                    </p>
                    <p className="text-xs text-slate-500">{alumno.email}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                    En curso
                  </span>
                </div>
              </div>
            ))}

            {alumnos.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No hay alumnos visibles para este tutor en la relación de grupos.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-primary">Calificaciones</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <GradeItem label="Gramática" value="91%" />
          <GradeItem label="Lectura" value="88%" />
          <GradeItem label="Speaking" value="84%" />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-primary">{value}</p>
    </div>
  );
}

function GradeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-2 text-2xl font-black text-primary">{value}</p>
    </div>
  );
}
