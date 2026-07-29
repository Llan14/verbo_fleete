"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";

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

function ReporteSesionContenido() {
  const searchParams = useSearchParams();
  const sesionId = searchParams.get("id");
  
  const [sesion, setSesion] = useState<SesionCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReporte = async () => {
      try {
        const token = getClientToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/me/${sesionId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) throw new Error("Sesión expirada");
        if (!res.ok) throw new Error("Error al cargar el reporte");

        const data = await res.json();
        setSesion(data);
      } catch (err: any) {
        setError(err.message || "Hubo un problema al cargar los datos.");
      }  finally {
        setLoading(false);
      }
    };

    if (sesionId) fetchReporte();
  }, [sesionId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Recuperando el análisis de tu profesor IA...</p>
      </div>
    );
  }

  if (error || !sesion) {
    return (
      <div className="max-w-3xl mx-auto font-sans p-8">
        <div className="bg-rose-500/10 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 p-6 rounded-2xl border border-rose-500/30 text-center backdrop-blur-md">
          <p className="font-bold text-lg mb-2">No pudimos cargar el reporte</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  const errores = sesion.detalles.filter(d => d.puntaje < 100);
  const aciertos = sesion.detalles.filter(d => d.puntaje === 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans animate-in fade-in duration-500">
      <GlassCard className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 text-sky-700 dark:text-sky-200 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
              {sesion.modulo}
            </span>
            <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">
              {new Date(sesion.fecha).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white capitalize">
            {sesion.tense}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm capitalize">Modo: {sesion.mood}</p>
        </div>

        <div className="flex flex-col items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 w-32 h-32 rounded-full shadow-inner">
          <span className="text-4xl font-black text-sky-600 dark:text-sky-400">{sesion.puntaje_total}</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Pts</span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 flex justify-between items-center border-emerald-500/30 bg-emerald-500/10">
          <span className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">Aciertos</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{aciertos.length}</span>
        </GlassCard>
        <GlassCard className="p-4 flex justify-between items-center border-rose-500/30 bg-rose-500/10">
          <span className="font-bold text-rose-800 dark:text-rose-200 text-sm">Errores</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{errores.length}</span>
        </GlassCard>
      </div>

      <GlassCard className="p-6 md:p-8 space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">
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
                    ? "bg-slate-50 dark:bg-slate-950/60 border-rose-500/30 shadow-sm" 
                    : "bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-white/5 opacity-80"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${esError ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}>
                      {esError ? '✕' : '✓'}
                    </span>
                    <span className="font-black text-lg text-slate-900 dark:text-white capitalize">
                      {detalle.verbo_infinitivo}
                    </span>
                  </div>
                  <span className={`font-bold text-sm px-3 py-1 rounded-full ${esError ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'}`}>
                    {esError ? `-${100 - detalle.puntaje} pts` : '+100 pts'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="bg-white dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200 dark:border-white/10 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Tu respuesta</p>
                    <p className={`font-medium text-sm ${esError ? 'text-rose-700 dark:text-rose-300 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {detalle.respuesta_usuario || "(En blanco)"}
                    </p>
                  </div>
                  {esError && (
                    <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                      <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 mb-1">Respuesta correcta</p>
                      <p className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                        {detalle.respuesta_correcta}
                      </p>
                    </div>
                  )}
                </div>

                {esError && detalle.feedback_ia && (
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 relative overflow-hidden backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-amber-900 dark:text-amber-200 text-xs">Diagnóstico:</span>
                          <span className="bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-500/30">
                            {detalle.categoria_error || "Gramática"}
                          </span>
                        </div>
                        <p className="text-amber-950/90 dark:text-amber-100/90 text-xs italic leading-relaxed">
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
      </GlassCard>
    </div>
  );
}

export default function ReporteSesionPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-slate-600 dark:text-slate-300">Cargando reporte...</div>}>
      <ReporteSesionContenido />
    </Suspense>
  );
}