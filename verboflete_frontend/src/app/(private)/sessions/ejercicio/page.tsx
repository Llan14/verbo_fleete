"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; // <-- Usamos useSearchParams en lugar de useParams

interface DetalleSesion {
  verbo_infinitivo: string;
  respuesta_correcta: string;
  respuesta_usuario: string;
  puntaje: number;
  categoria_error: string | null;
  feedback_ia: string | null;
}

interface SesionCompleta {
  id: number;
  fecha: string;
  modulo: string;
  mood: string;
  tense: string;
  puntaje_total: number;
  texto_generado_ia: string | null;
  detalles: DetalleSesion[];
}

// --- SEPARAMOS LA LÓGICA EN UN SUB-COMPONENTE ---
function ReporteSesionContenido() {
  const searchParams = useSearchParams();
  const sesionId = searchParams.get("id"); // <-- Leemos el ?id= de la URL
  
  const [sesion, setSesion] = useState<SesionCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReporte = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/me/${sesionId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) throw new Error("Sesión expirada");
        if (!res.ok) throw new Error("Error al cargar el reporte");

        const data = await res.json();
        setSesion(data);
      } catch (err: any) {
        setError(err.message || "Hubo un problema al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    if (sesionId) fetchReporte();
  }, [sesionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-muted">
        <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Recuperando el análisis de tu profesor IA...</p>
      </div>
    );
  }

  if (error || !sesion) {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
          <p className="font-bold text-lg mb-2">No pudimos cargar el reporte</p>
          <p className="text-sm opacity-80 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const errores = sesion.detalles.filter(d => d.puntaje < 100);
  const aciertos = sesion.detalles.filter(d => d.puntaje === 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-menu-active text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
              {sesion.modulo}
            </span>
            <span className="text-text-muted text-sm font-medium">
              {new Date(sesion.fecha).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-3xl font-black text-primary capitalize">
            {sesion.tense}
          </h1>
          <p className="text-text-muted font-medium mt-1 capitalize">Modo: {sesion.mood}</p>
        </div>

        <div className="flex flex-col items-center justify-center shrink-0 bg-background border border-border w-32 h-32 rounded-full shadow-inner">
          <span className="text-4xl font-black text-primary">{sesion.puntaje_total}</span>
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Pts</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex justify-between items-center">
          <span className="font-bold text-green-800">Aciertos</span>
          <span className="text-2xl font-black text-green-600">{aciertos.length}</span>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex justify-between items-center">
          <span className="font-bold text-rose-800">Errores</span>
          <span className="text-2xl font-black text-rose-600">{errores.length}</span>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-primary border-b border-border pb-2">
          Análisis Detallado
        </h3>

        <div className="flex flex-col gap-4">
          {sesion.detalles.map((detalle, index) => {
            const esError = detalle.puntaje < 100;

            return (
              <div 
                key={index} 
                className={`p-5 rounded-2xl border transition-all ${
                  esError 
                    ? "bg-white border-rose-200 shadow-sm" 
                    : "bg-background border-border opacity-70"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${esError ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-600'}`}>
                      {esError ? '✕' : '✓'}
                    </span>
                    <span className="font-black text-lg text-primary capitalize">
                      {detalle.verbo_infinitivo}
                    </span>
                  </div>
                  <span className={`font-bold text-sm px-3 py-1 rounded-full ${esError ? 'bg-rose-50 text-rose-700' : 'bg-green-50 text-green-700'}`}>
                    {esError ? `-${100 - detalle.puntaje} pts` : '+100 pts'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-background rounded-xl p-3 border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Tu respuesta</p>
                    <p className={`font-medium ${esError ? 'text-rose-600 line-through decoration-rose-300' : 'text-primary'}`}>
                      {detalle.respuesta_usuario || "(En blanco)"}
                    </p>
                  </div>
                  {esError && (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <p className="text-[10px] uppercase font-bold text-green-700/70 mb-1">Respuesta correcta</p>
                      <p className="font-bold text-green-700">
                        {detalle.respuesta_correcta}
                      </p>
                    </div>
                  )}
                </div>

                {esError && detalle.feedback_ia && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-amber-900 text-sm">Diagnóstico:</span>
                          <span className="bg-white border border-amber-200 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                            {detalle.categoria_error || "Gramática"}
                          </span>
                        </div>
                        <p className="text-amber-800 text-sm italic leading-relaxed">
                          "{detalle.feedback_ia}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- ENVOLVEMOS LA PÁGINA EN SUSPENSE PARA QUE NEXT.JS NO LLORE ---
export default function ReporteSesionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando reporte...</div>}>
      <ReporteSesionContenido />
    </Suspense>
  );
}