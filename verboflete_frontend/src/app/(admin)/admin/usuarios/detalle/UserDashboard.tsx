"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";

interface TenseStat { name: string; score: number; total: number; }
interface Weakness { category: string; mastery_level: number; error_count: number; }
interface DashboardData {
  totalExercises: number;
  weakestTense: { name: string; score: number } | null;
  stats: TenseStat[];
  report: { recommendations: string[]; weaknesses: Weakness[]; } | null;
}

export default function UserDashboard({ usuarioId }: { usuarioId: string }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserDashboard = async () => {
      try {
        const token = getClientToken();
        if (!token) { router.push("/login"); return; }
        const resMe = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!resMe.ok) throw new Error("Error de sesión");
        const userData = await resMe.json();
        if (userData.rol !== "admin" && userData.rol !== "administrador") {
          router.push("/dashboard"); return; 
        }
        const resStats = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/admin/user-dashboard/${usuarioId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!resStats.ok) throw new Error("Error al cargar el progreso.");
        const statsData = await resStats.json();
        setData(statsData);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    if (usuarioId) fetchUserDashboard();
  }, [usuarioId, router]);

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-600 dark:text-slate-300">
      <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-medium text-sm">Calculando métricas del alumno...</p>
    </div>
  );

  if (error || !data) return (
    <div className="max-w-6xl mx-auto p-8 font-sans">
      <Link href="/admin/usuarios" className="text-sky-600 dark:text-sky-300 font-bold hover:underline mb-6 inline-block">← Volver a la lista</Link>
      <div className="bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-800 dark:text-rose-200 p-4 rounded-2xl backdrop-blur-md">{error}</div>
    </div>
  );

  const { totalExercises, weakestTense, stats, report } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans animate-in fade-in duration-500">
      <Link href="/admin/usuarios" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-sm flex items-center gap-2 w-fit transition-colors">
        ← Volver a Usuarios
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reporte del Alumno</h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">ID de Usuario: {usuarioId}</p>
        </div>
        <StatBadge label="Ejercicios Realizados" value={totalExercises.toString()} icon="📝" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {weakestTense && weakestTense.score < 85 && (
            <GlassCard className="border-amber-500/30 dark:border-amber-400/30 bg-amber-500/10 p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-3xl bg-amber-500/20 border border-amber-500/30 dark:border-amber-400/30 w-14 h-14 rounded-2xl flex shrink-0 items-center justify-center">🎯</div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-amber-900 dark:text-amber-200 font-bold text-lg">Foco de Atención</h4>
                  <p className="text-amber-950/90 dark:text-amber-100/90 text-sm mt-1 leading-relaxed">
                    El dominio en <span className="font-black underline decoration-amber-500 dark:decoration-amber-400 underline-offset-4">{weakestTense.name}</span> es de {weakestTense.score}%.
                    {report?.recommendations && report.recommendations.length > 0 && (
                      <span className="block mt-2 font-medium text-amber-900/80 dark:text-amber-200/80 italic">💡 {report.recommendations[0]}</span>
                    )}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Rendimiento Histórico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stats.map((tense, index) => (
                <TenseCard key={index} name={tense.name} score={tense.score} total={tense.total} color={getColor(tense.name)} />
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">🔍 Debilidades</h3>
              <span className="text-[10px] font-black text-rose-800 dark:text-rose-300 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full uppercase">Alerta IA</span>
            </div>
            <div className="space-y-3">
              {report?.weaknesses && report.weaknesses.length > 0 ? (
                [...report.weaknesses]
                  .sort((a, b) => a.mastery_level - b.mastery_level)
                  .slice(0, 5)
                  .map((weakness, i) => (
                    <ErrorItem key={i} text={weakness.category} severity={getSeverity(weakness.mastery_level)} count={weakness.error_count} />
                  ))
              ) : (
                <div className="py-8 text-center bg-slate-100/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-white/10">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sin patrones de error detectados.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

const getColor = (name: string) => {
  const colors = ["bg-sky-500 dark:bg-sky-400", "bg-teal-500 dark:bg-teal-400", "bg-indigo-500 dark:bg-indigo-400", "bg-purple-500 dark:bg-purple-400", "bg-pink-500 dark:bg-pink-400"];
  return colors[name.length % colors.length];
};

const getSeverity = (masteryLevel: number) => {
  if (masteryLevel < 50) return "high";
  if (masteryLevel < 80) return "medium";
  return "low";
};

const StatBadge = ({ label, value, icon }: any) => (
  <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-sm">
    <div className="text-2xl bg-slate-100 dark:bg-white/10 w-10 h-10 flex shrink-0 items-center justify-center rounded-xl">{icon}</div>
    <div>
      <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 leading-none mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
  </div>
);

const TenseCard = ({ name, score, color }: any) => (
  <div className="p-2 transition-all">
    <div className="flex justify-between items-center mb-2">
      <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight capitalize">{name}</span>
      <span className="text-sm font-black text-sky-600 dark:text-sky-400">{score}%</span>
    </div>
    <div className="w-full bg-slate-200/80 dark:bg-slate-950/60 rounded-full h-3 overflow-hidden border border-slate-200/80 dark:border-white/10">
      <div className={`${color} h-full rounded-full transition-all duration-1000 ease-out shadow-inner`} style={{ width: `${score}%` }} />
    </div>
  </div>
);

const ErrorItem = ({ text, severity, count }: any) => {
  const colors = { 
    high: "border-l-rose-500 text-rose-900 dark:text-rose-200 bg-rose-500/10 border-slate-200 dark:border-white/10", 
    medium: "border-l-amber-500 text-amber-900 dark:text-amber-200 bg-amber-500/10 border-slate-200 dark:border-white/10", 
    low: "border-l-sky-500 text-sky-900 dark:text-sky-200 bg-sky-500/10 border-slate-200 dark:border-white/10" 
  };
  return (
    <div className={`px-4 py-2.5 rounded-xl border border-l-4 text-[13px] font-bold flex justify-between items-center backdrop-blur-md ${colors[severity as keyof typeof colors]}`}>
      <span className="truncate pr-2 capitalize">{text}</span>
      <span className="bg-slate-200/80 dark:bg-white/10 px-2 py-0.5 rounded-md text-[10px] text-slate-800 dark:text-white">{count} fallos</span>
    </div>
  );
};