"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface AlumnoSummary {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  progreso: number;
  ultimaActividad: string;
}

export default function PadresPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [alumnos, setAlumnos] = useState<AlumnoSummary[]>([]);

  useEffect(() => {
    const cargarVista = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Debes iniciar sesión.");
        }

        const resMe = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
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

        const resAlumnos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resAlumnos.ok) {
          throw new Error("No se pudo obtener la información de progreso.");
        }

        const data: Array<{ id: number; nombre: string; apellidos: string; email: string; rol: string }> = await resAlumnos.json();
        const listaAlumnos = data
          .filter((u) => u.rol === "estudiante")
          .map((u) => ({
            id: u.id,
            nombre: u.nombre,
            apellidos: u.apellidos,
            email: u.email,
            progreso: 88,
            ultimaActividad: "Hoy a las 18:30",
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
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black text-primary">Panel de Padres de Familia</h1>
        <Link
          href="/calendario"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          ← Volver al calendario
        </Link>
      </div>
      <p className="text-sm text-slate-600">
        Aquí puedes ver el estado de trabajo de tu hijo o hija en la plataforma.
      </p>

      <div className="grid gap-4">
        {alumnos.map((alumno) => (
          <div key={alumno.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {alumno.nombre} {alumno.apellidos}
                </h2>
                <p className="text-sm text-slate-500">{alumno.email}</p>
              </div>

              <div className="min-w-[220px]">
                <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Progreso</span>
                  <span>{alumno.progreso}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-teal-500" style={{ width: `${alumno.progreso}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              Última actividad: {alumno.ultimaActividad}
            </div>
          </div>
        ))}

        {alumnos.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
            Actualmente no hay alumnos asociados para monitorear.
          </div>
        )}
      </div>
    </div>
  );
}
