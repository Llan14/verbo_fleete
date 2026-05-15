"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import UserDashboard from "./UserDashboard"; 

function DetalleContenedor() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Error: No se encontró el ID del usuario en la URL.
      </div>
    );
  }

  return <UserDashboard usuarioId={id} />;
}

export default function PageDetalleUsuario() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Cargando datos del alumno...</div>}>
      <DetalleContenedor />
    </Suspense>
  );
}