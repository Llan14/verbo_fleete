"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; 

interface TenseStat {
  name: string;
  score: number;
  total: number;  
}

interface Weakness {
  category: string;
  mastery_level: number;
  error_count: number;
}

interface DashboardData {
  totalExercises: number;
  weakestTense: { name: string; score: number } | null;
  stats: TenseStat[];
  report: {
    recommendations: string[];
    weaknesses: Weakness[];
  } | null;
}

interface SesionResumen {
  id: number;
  fecha: string;
  modulo: string;
  mood: string;
  tense: string;
  puntaje_total: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [historial, setHistorial] = useState<SesionResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [dashRes, histRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/dashboard`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/me`, { headers })
        ]);

        if (dashRes.status === 401 || histRes.status === 401) {
          throw new Error("Sesión expirada");
        }
        if (!dashRes.ok || !histRes.ok) {
          throw new Error("Error al cargar los datos");
        }

        const jsonDash = await dashRes.json();
        const jsonHist = await histRes.json();
        
        setData(jsonDash);
        setHistorial(jsonHist);
      } catch (err: any) {
        setError(err.message || "No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-muted">
        <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Calculando tu maestría...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error || "No hay datos disponibles."}
        </div>
      </div>
    );
  }

  const { totalExercises, weakestTense, stats, report } = data;

  return (
    <div className=" mx-auto font-sans animate-in fade-in slide-in-from-top-4 duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight text-balance">
            Mi Progreso
          </h1>
        </div>
        <StatBadge
          label="Total Ejercicios"
          value={totalExercises.toString()}
          icon="📝"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          
          {weakestTense && weakestTense.score < 85 && (
            <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="text-4xl bg-surface w-16 h-16 rounded-2xl flex shrink-0 items-center justify-center shadow-inner">
                🎯
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-amber-900 font-bold text-lg">
                  Sugerencia de Práctica
                </h4>
                <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                  Tu dominio de{" "}
                  <span className="font-black underline decoration-amber-400 underline-offset-4">
                    {weakestTense.name}
                  </span>{" "}
                  es de solo {weakestTense.score}%. 
                  
                  {report?.recommendations && report.recommendations.length > 0 && (
                    <span className="block mt-2 font-medium text-amber-900/80 italic">
                      💡 Tip de la IA: {report.recommendations[0]}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="bg-surface p-8 rounded-3xl shadow-sm border border-border">
            <h3 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">
              Dominio por Tiempo Verbal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stats.map((tense, index) => (
                <div key={`${tense.name}-${index}`} className="relative">
                  {weakestTense?.name === tense.name && (
                    <div className="absolute -top-3 -right-2 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-md animate-bounce tracking-tighter">
                      PRIORIDAD
                    </div>
                  )}
                  <TenseCard
                    name={tense.name}
                    score={tense.score}
                    total={tense.total}
                    color={getColor(tense.name)}
                  />
                </div>
              ))}
              
              {stats.length === 0 && (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-border rounded-3xl bg-background">
                  <p className="text-text-muted font-medium">
                    Aún no hay datos para mostrar gráficas. ¡Haz tu primer ejercicio!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-3xl shadow-sm border border-border h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-primary">
                📝 Reportes
              </h3>
              <span className="text-[10px] font-black text-teal-700 bg-teal-100 px-2 py-1 rounded-full uppercase">
                Historial
              </span>
            </div>

            <p className="text-xs text-text-muted mb-6 leading-relaxed">
              Haz clic en tus sesiones recientes para ver la corrección y el análisis detallado de tu profesor IA.
            </p>

<div className={`space-y-3 transition-all duration-300 ${mostrarTodos ? "max-h-70 overflow-y-auto pr-2 custom-scrollbar" : ""}`}>
  {historial.length > 0 ? (
    (mostrarTodos ? historial : historial.slice(0, 4)).map((sesion) => (
      <Link 
        key={sesion.id} 
        href={`/sessions/ejercicio?id=${sesion.id}`}
      >
        <div className="px-4 py-2 rounded-2xl border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex justify-between items-center group mb-2">
          <div className="flex flex-col">
            <span className="font-bold text-primary capitalize text-sm group-hover:text-menu-active transition-colors">
              {sesion.tense}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                {sesion.modulo}
              </span>
              <span className="text-[10px] text-text-muted">
                {new Date(sesion.fecha).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-sm font-black ${sesion.puntaje_total >= 60 ? 'text-green-600' : 'text-rose-600'}`}>
              {sesion.puntaje_total} pts
            </span>
            <span className="text-lg opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-menu-active">
              →
            </span>
          </div>
        </div>
      </Link>
    ))
  ) : (
    <div className="py-8 text-center bg-background rounded-2xl border border-border">
      <p className="text-text-muted text-sm font-medium">
        Aún no tienes sesiones. ¡Haz tu primer ejercicio!
      </p>
    </div>
  )}
</div>

{historial.length > 4 && (
  <div className="mt-4 pt-2 border-t border-border text-center">
    <button
      onClick={() => setMostrarTodos(!mostrarTodos)}
      className="text-xs font-bold text-menu-active hover:underline underline-offset-4 transition-colors"
    >
      {mostrarTodos ? "▲ Mostrar menos" : `▼ Ver todos (${historial.length})`}
    </button>
  </div>
)}                        
            {historial.length > 0 && historial.length <= 4 && (
               <div className="mt-6 pt-4 border-t border-border text-center">
                 <p className="text-text-muted text-[11px] leading-relaxed italic">
                   Estas son todas tus sesiones hasta ahora.
                 </p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


const getColor = (name: string) => {
  const colors = ["bg-blue-500", "bg-teal-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500"];
  return colors[name.length % colors.length];
};

const getSeverity = (masteryLevel: number) => {
  if (masteryLevel < 50) return "high";
  if (masteryLevel < 80) return "medium";
  return "low";
};

const StatBadge = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="bg-surface px-6 py-4 rounded-3xl shadow-sm border border-border flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className="text-3xl bg-background w-12 h-12 flex shrink-0 items-center justify-center rounded-2xl">
      {icon}
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-text-muted leading-none mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-primary tracking-tight">
        {value}
      </p>
    </div>
  </div>
);

const TenseCard = ({ name, score, total, color }: { name: string; score: number; total: number; color: string }) => (
  <div className="p-2 transition-all">
    <div className="flex justify-between items-center mb-3">
      <span className="font-bold text-primary text-sm tracking-tight capitalize">
        {name}
      </span>
      <div className="text-right">
        <span className="text-sm font-black text-primary">{score}%</span>
      </div>
    </div>
    <div className="w-full bg-border/40 rounded-full h-3 overflow-hidden border border-border/50">
      <div
        className={`${color} h-full rounded-full transition-all duration-1000 ease-out shadow-inner`}
        style={{ width: `${score}%` }}
      />
    </div>
    <div className="flex justify-between mt-3">
      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
        Maestría
      </p>
      <p className="text-[10px] text-text-muted font-medium italic">
        {total} verbos
      </p>
    </div>
  </div>
);

const ErrorItem = ({ text, severity, count }: { text: string; severity: string; count: number }) => {
  const colors = {
    high: "border-l-rose-500 text-rose-700 bg-rose-50",
    medium: "border-l-amber-500 text-amber-700 bg-amber-50",
    low: "border-l-blue-500 text-blue-700 bg-blue-50",
  };
  
  return (
    <div
      className={`px-4 py-3 rounded-2xl border-l-4 text-[13px] font-bold flex justify-between items-center mb-2 ${colors[severity as keyof typeof colors]}`}
    >
      <span className="truncate pr-2 capitalize">{text}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="bg-white/60 px-2 py-0.5 rounded-lg text-[10px] shadow-sm text-slate-800">
          {count} fallos
        </span>
      </div>
    </div>
  );
};