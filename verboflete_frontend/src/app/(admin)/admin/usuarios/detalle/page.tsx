"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import UserDashboard from "./UserDashboard"; 

function DetalleContenedor() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="mx-auto max-w-2xl p-6 font-sans">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-6 text-center text-rose-800 dark:text-rose-200 font-bold backdrop-blur-md">
          Error: No se encontró el ID del usuario en la URL.
        </div>
      </div>
    );
  }

  return <UserDashboard usuarioId={id} />;
}

export default function PageDetalleUsuario() {
  return (
    <Suspense 
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-bold p-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 dark:border-sky-400 border-t-transparent" />
          <p className="text-sm font-medium">Cargando datos del alumno...</p>
        </div>
      }
    >
      <DetalleContenedor />
    </Suspense>
  );
}