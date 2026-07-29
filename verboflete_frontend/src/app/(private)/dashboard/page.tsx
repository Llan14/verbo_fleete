"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link"; 
import ModuleFooterDecoration from "@/components/branding/ModuleFooterDecoration";
import { GlassCard } from "@/components/GlassCard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

interface Badge {
  key: string;
  label: string;
  unlocked: boolean;
}

interface GamificationData {
  current_streak: number;
  longest_streak: number;
  badges: Badge[];
}

interface SesionResumen {
  id: number;
  fecha: string;
  modulo: string;
  mood: string;
  tense: string;
  puntaje_total: number;
}

function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [historial, setHistorial] = useState<SesionResumen[]>([]);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = getClientToken();
        const headers = { "Authorization": `Bearer ${token}` };

        const [dashRes, histRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/dashboard`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/me`, { headers })
        ]);

        const gamificationRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/gamification`, { headers });

        if (dashRes.status === 401 || histRes.status === 401) {
          throw new Error("Sesión expirada");
        }
        if (!dashRes.ok || !histRes.ok) {
          throw new Error("Error al cargar los datos");
        }

        const jsonDash = await dashRes.json();
        const jsonHist = await histRes.json();
        const jsonGamification = gamificationRes.ok ? await gamificationRes.json() : null;
        
        setData(jsonDash);
        setHistorial(jsonHist);
        setGamification(jsonGamification);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("No se pudo conectar con el servidor.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { data, historial, gamification, loading, error };
}

export default function DashboardPage() {
  const { data, historial, gamification, loading, error } = useDashboardData();
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const descargarReportePdf = async () => {
    try {
      const token = getClientToken();
      const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/report/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo generar el PDF");
      }

      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte_progreso.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("No se pudo descargar el reporte PDF.");
    }
  };

  const displayedHistorial = useMemo(() => {
    return mostrarTodos ? historial : historial.slice(0, 4);
  }, [historial, mostrarTodos]);

  const chartStats = useMemo(() => {
    if (!data?.stats) return [];
    return data.stats.map((item) => ({
      tense: item.name,
      score: Number(item.score.toFixed(1)),
      total: item.total,
    }));
  }, [data]);

  const chartSessions = useMemo(() => {
    return [...historial]
      .reverse()
      .slice(0, 12)
      .map((sesion, index) => ({
        sesion: `S${index + 1}`,
        puntaje: sesion.puntaje_total,
      }));
  }, [historial]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Calculando tu maestría...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-rose-500/20 text-rose-200 p-4 rounded-2xl border border-rose-500/30 backdrop-blur-md">
          {error || "No hay datos disponibles."}
        </div>
      </div>
    );
  }

  const { totalExercises, weakestTense, stats, report } = data;

  return (
    <div className="mx-auto font-sans animate-in fade-in slide-in-from-top-4 duration-700 space-y-8">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Mi Progreso
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Revisa las métricas y la evolución de tu aprendizaje.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/calendario"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/20 hover:text-white backdrop-blur-md"
          >
            ← Volver al calendario
          </Link>
          <button
            onClick={descargarReportePdf}
            className="rounded-xl border border-sky-400/30 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/30 hover:text-white backdrop-blur-md"
          >
            Descargar PDF
          </button>
          
          <StatBadge
            label="Total Ejercicios"
            value={totalExercises.toString()}
            icon="📝"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda (2/3): Gráficas y Métricas */}
        <div className="lg:col-span-2 space-y-6">
          
          {weakestTense && weakestTense.score < 85 && report?.recommendations && report.recommendations.length > 0 && (
            <GlassCard theme="dark" className="border-amber-400/30 bg-amber-500/10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-3xl bg-amber-500/20 border border-amber-400/30 w-14 h-14 rounded-2xl flex shrink-0 items-center justify-center shadow-inner">
                  💡
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-amber-200 font-bold text-lg">
                    Sugerencia de Práctica
                  </h4>
                  <p className="text-amber-100/90 text-sm mt-1 leading-relaxed">
                    Tu dominio de{" "}
                    <span className="font-black underline decoration-amber-400 underline-offset-4">
                      {weakestTense.name}
                    </span>{" "}
                    es de solo {weakestTense.score}%.
                    <span className="block mt-2 font-medium text-amber-200/80 italic">
                      💡 Tip de la IA: {report.recommendations[0]}
                    </span>
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard theme="dark" className="p-8">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
              Puntuación y Dominio por Tiempo Verbal
            </h3>

            {stats.length === 0 ? (
              <div className="col-span-2 py-12 text-center border border-dashed border-white/10 rounded-2xl bg-slate-900/40">
                <p className="text-slate-400 font-medium text-sm">
                  Aún no hay datos para mostrar gráficas. ¡Haz tu primer ejercicio!
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="h-72 w-full rounded-2xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartStats} margin={{ top: 16, right: 16, left: 0, bottom: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                      <XAxis dataKey="tense" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "8px" }} />
                      <Bar dataKey="score" name="Maestría (%)" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {chartSessions.length > 1 && (
                  <div className="h-72 w-full rounded-2xl border border-white/10 bg-slate-950/40 p-4 backdrop-blur-md">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartSessions} margin={{ top: 16, right: 16, left: 0, bottom: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                        <XAxis dataKey="sesion" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "8px" }} />
                        <Line
                          type="monotone"
                          dataKey="puntaje"
                          name="Evolución"
                          stroke="#60a5fa"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#3b82f6" }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

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
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Columna Derecha (1/3): Gamificación y Tareas */}
        <div className="space-y-6">
          
          {/* Gamificación */}
          {gamification && (
            <GlassCard theme="dark" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🔥 Gamificación
                </h3>
                <span className="text-[10px] font-black text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 rounded-full uppercase">
                  Streaks
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Racha Actual</p>
                  <p className="text-2xl font-black text-sky-400">{gamification.current_streak}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Mejor Racha</p>
                  <p className="text-2xl font-black text-sky-400">{gamification.longest_streak}</p>
                </div>
              </div>

              <div className="space-y-2">
                {gamification.badges.map((badge) => (
                  <div
                    key={badge.key}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                      badge.unlocked
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                        : "border-white/10 bg-slate-950/20 text-slate-500"
                    }`}
                  >
                    {badge.unlocked ? "✅" : "🔒"} {badge.label}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Áreas de Mejora */}
          {report?.weaknesses && report.weaknesses.length > 0 && (
            <GlassCard theme="dark" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🚨 Áreas de Mejora
                </h3>
                <span className="text-[10px] font-black text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full uppercase">
                  IA Report
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                La IA ha identificado estas categorías como tus puntos más débiles. ¡Enfócate en ellas!
              </p>
              {report.weaknesses.map((weakness, index) => (
                <ErrorItem
                  key={index}
                  text={weakness.category}
                  severity={getSeverity(weakness.mastery_level)}
                  count={weakness.error_count}
                />
              ))}
            </GlassCard>
          )}

          {/* Historial de Sesiones */}
          <GlassCard theme="dark" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📝 Reportes
              </h3>
              <span className="text-[10px] font-black text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2 py-0.5 rounded-full uppercase">
                Historial
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Haz clic en tus sesiones recientes para ver la corrección y el análisis detallado de tu profesor IA.
            </p>

            <div className={`space-y-3 transition-all duration-300 ${mostrarTodos ? "max-h-72 overflow-y-auto pr-2 custom-scrollbar" : ""}`}>
              {historial.length > 0 ? (
                displayedHistorial.map((sesion) => (
                  <Link 
                    key={sesion.id} 
                    href={`/sessions/ejercicio?id=${sesion.id}`}
                  >
                    <div className="px-4 py-3 rounded-2xl border border-white/10 bg-slate-950/40 hover:border-sky-400/40 hover:bg-white/10 transition-all cursor-pointer flex justify-between items-center group mb-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-white capitalize text-sm group-hover:text-sky-300 transition-colors">
                          {sesion.tense}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase text-slate-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                            {sesion.modulo}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(sesion.fecha).toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-sm font-black ${sesion.puntaje_total >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {sesion.puntaje_total} pts
                        </span>
                        <span className="text-lg opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-sky-400">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center bg-slate-950/40 rounded-2xl border border-white/10">
                  <p className="text-slate-400 text-sm font-medium">
                    Aún no tienes sesiones. ¡Haz tu primer ejercicio!
                  </p>
                </div>
              )}
            </div>

            {historial.length > 4 && (
              <div className="mt-4 pt-3 border-t border-white/10 text-center">
                <button
                  onClick={() => setMostrarTodos(!mostrarTodos)}
                  aria-expanded={mostrarTodos}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  {mostrarTodos ? "▲ Mostrar menos" : `▼ Ver todos (${historial.length})`}
                </button>
              </div>
            )}                        
          </GlassCard>

        </div>
      </div>

      <ModuleFooterDecoration />
    </div>
  );
}

const getColor = (name: string) => {
  const colors = ["bg-sky-400", "bg-teal-400", "bg-indigo-400", "bg-purple-400", "bg-pink-400"];
  return colors[name.length % colors.length];
};

const getSeverity = (masteryLevel: number) => {
  if (masteryLevel < 50) return "high";
  if (masteryLevel < 80) return "medium";
  return "low";
};

const StatBadge = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="bg-slate-900/60 border border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md flex items-center gap-3">
    <div className="text-2xl bg-white/10 w-10 h-10 flex shrink-0 items-center justify-center rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">
        {label}
      </p>
      <p className="text-xl font-black text-white tracking-tight">
        {value}
      </p>
    </div>
  </div>
);

const TenseCard = ({ name, score, total, color }: { name: string; score: number; total: number; color: string }) => (
  <div className="p-2 transition-all">
    <div className="flex justify-between items-center mb-2">
      <span className="font-bold text-white text-sm tracking-tight capitalize">
        {name}
      </span>
      <span className="text-sm font-black text-sky-400">{score}%</span>
    </div>
    <div className="w-full bg-slate-950/60 rounded-full h-3 overflow-hidden border border-white/10">
      <div
        className={`${color} h-full rounded-full transition-all duration-1000 ease-out shadow-inner`}
        style={{ width: `${score}%` }}
      />
    </div>
    <div className="flex justify-between mt-2">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Maestría
      </p>
      <p className="text-[10px] text-slate-400 font-medium italic">
        {total} verbos
      </p>
    </div>
  </div>
);

const ErrorItem = ({ text, severity, count }: { text: string; severity: string; count: number }) => {
  const colors = {
    high: "border-l-rose-500 text-rose-200 bg-rose-500/10 border-white/10",
    medium: "border-l-amber-500 text-amber-200 bg-amber-500/10 border-white/10",
    low: "border-l-sky-500 text-sky-200 bg-sky-500/10 border-white/10",
  };
  
  return (
    <div
      className={`px-4 py-2.5 rounded-xl border border-l-4 text-[13px] font-bold flex justify-between items-center mb-2 backdrop-blur-md ${colors[severity as keyof typeof colors]}`}
    >
      <span className="truncate pr-2 capitalize">{text}</span>
      <span className="bg-white/10 px-2 py-0.5 rounded-md text-[10px] text-white">
        {count} fallos
      </span>
    </div>
  );
};