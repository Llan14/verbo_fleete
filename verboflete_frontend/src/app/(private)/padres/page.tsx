"use client";

import { getClientToken } from "@/lib/authToken";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";

interface AlumnoSummary {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  progreso: number;
  ultimaActividad: string;
}

function formatearUltimaActividad(isoDate: string | null): string {
  if (!isoDate) {
    return "Sin actividad registrada";
  }

  const date = new Date(isoDate);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PadresPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [alumnos, setAlumnos] = useState<AlumnoSummary[]>([]);

  useEffect(() => {
    const cargarVista = async () => {
      try {
        const token = getClientToken();
        if (!token) {
          throw new Error("Debes iniciar sesión.");
        }

        const resMe = await fetch(`/api/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resMe.ok) {
          throw new Error("No se pudo verificar tu sesión.");
        }

        const userData = await resMe.json();
        if (userData.rol !== "padres" && userData.rol !== "parent") {
          setError("Este panel es exclusivo para usuarios con rol padres de familia.");
          return;
        }

        const resAlumnos = await fetch(`/api/usuarios/me/hijos/progreso`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resAlumnos.ok) {
          throw new Error("No se pudo obtener la información de progreso.");
        }

        const data: Array<{ id: number; nombre: string; apellidos: string; email: string; progreso: number; ultima_actividad: string | null }> = await resAlumnos.json();
        const listaAlumnos = data.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          apellidos: u.apellidos,
          email: u.email,
          progreso: u.progreso,
          ultimaActividad: formatearUltimaActividad(u.ultima_actividad),
        }));

        setAlumnos(listaAlumnos);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    };

    cargarVista();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-5 text-rose-800 dark:text-rose-200 backdrop-blur-md">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8 font-sans animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Panel de Padres de Familia</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Aquí puedes ver el estado de trabajo de tu hijo o hija en la plataforma.
          </p>
        </div>
        <Link
          href="/calendario"
          className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white backdrop-blur-md cursor-pointer shadow-sm"
        >
          ← Volver al calendario
        </Link>
      </div>

      <div className="grid gap-4">
        {alumnos.map((alumno) => (
          <GlassCard key={alumno.id} className="p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {alumno.nombre} {alumno.apellidos}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{alumno.email}</p>
              </div>

              <div className="min-w-[220px]">
                <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span>Progreso</span>
                  <span>{alumno.progreso}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 overflow-hidden">
                  <div className="h-3 rounded-full bg-sky-500 dark:bg-sky-400 transition-all duration-500" style={{ width: `${alumno.progreso}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-100/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 p-3 text-sm text-slate-700 dark:text-slate-300">
              Última actividad: {alumno.ultimaActividad}
            </div>
          </GlassCard>
        ))}

        {alumnos.length === 0 && (
          <GlassCard className="p-5 text-slate-600 dark:text-slate-400 text-center">
            Actualmente no hay alumnos asociados para monitorear.
          </GlassCard>
        )}
      </div>
    </div>
  );
}