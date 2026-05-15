"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        const token = localStorage.getItem("token");
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
    <div className="min-h-screen flex flex-col items-center justify-center text-text-muted">
      <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-medium">Calculando métricas del alumno...</p>
    </div>
  );

  if (error || !data) return (
    <div className="max-w-6xl mx-auto p-8">
      <Link href="/admin/usuarios" className="text-primary font-bold hover:underline mb-6 inline-block">← Volver a la lista</Link>
      <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200">{error}</div>
    </div>
  );

  const { totalExercises, weakestTense, stats, report } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8 font-sans animate-in fade-in slide-in-from-top-4 duration-700">
      <Link href="/admin/usuarios" className="text-text-muted hover:text-primary font-bold text-sm flex items-center gap-2 mb-2 w-fit transition-colors">
        ← Volver a Usuarios
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Reporte del Alumno</h1>
          <p className="text-text-muted mt-1">ID de Usuario: {usuarioId}</p>
        </div>
        <StatBadge label="Ejercicios Realizados" value={totalExercises.toString()} icon="📝" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {weakestTense && weakestTense.score < 85 && (
            <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="text-4xl bg-surface w-16 h-16 rounded-2xl flex shrink-0 items-center justify-center shadow-inner">🎯</div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-amber-900 font-bold text-lg">Foco de Atención</h4>
                <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                  El dominio en <span className="font-black underline decoration-amber-400 underline-offset-4">{weakestTense.name}</span> es de {weakestTense.score}%.
                  {report?.recommendations && report.recommendations.length > 0 && (
                    <span className="block mt-2 font-medium text-amber-900/80 italic">💡 {report.recommendations[0]}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="bg-surface p-8 rounded-3xl shadow-sm border border-border">
            <h3 className="text-xl font-bold text-primary mb-8 flex items-center gap-2">Rendimiento Histórico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stats.map((tense, index) => (
                <TenseCard key={index} name={tense.name} score={tense.score} total={tense.total} color={getColor(tense.name)} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-3xl shadow-sm border border-border h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-primary">🔍 Debilidades</h3>
              <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-1 rounded-full uppercase">Alerta IA</span>
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
                <div className="py-8 text-center bg-background rounded-2xl border border-border">
                  <p className="text-text-muted text-sm font-medium">Sin patrones de error detectados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- FUNCIONES AUXILIARES ---
const getColor = (name: string) => {
  const colors = ["bg-blue-500", "bg-teal-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500"];
  return colors[name.length % colors.length];
};

const getSeverity = (masteryLevel: number) => {
  if (masteryLevel < 50) return "high";
  if (masteryLevel < 80) return "medium";
  return "low";
};

const StatBadge = ({ label, value, icon }: any) => (
  <div className="bg-surface px-6 py-4 rounded-3xl shadow-sm border border-border flex items-center gap-4">
    <div className="text-3xl bg-background w-12 h-12 flex shrink-0 items-center justify-center rounded-2xl">{icon}</div>
    <div>
      <p className="text-[10px] uppercase font-bold text-text-muted leading-none mb-1">{label}</p>
      <p className="text-2xl font-black text-primary tracking-tight">{value}</p>
    </div>
  </div>
);

const TenseCard = ({ name, score, total, color }: any) => (
  <div className="p-2 transition-all">
    <div className="flex justify-between items-center mb-3">
      <span className="font-bold text-primary text-sm tracking-tight capitalize">{name}</span>
      <span className="text-sm font-black text-primary">{score}%</span>
    </div>
    <div className="w-full bg-border/40 rounded-full h-3 overflow-hidden border border-border/50">
      <div className={`${color} h-full rounded-full transition-all duration-1000 ease-out shadow-inner`} style={{ width: `${score}%` }} />
    </div>
  </div>
);

const ErrorItem = ({ text, severity, count }: any) => {
  const colors = { high: "border-l-rose-500 text-rose-700 bg-rose-50", medium: "border-l-amber-500 text-amber-700 bg-amber-50", low: "border-l-blue-500 text-blue-700 bg-blue-50" };
  return (
    <div className={`px-4 py-3 rounded-2xl border-l-4 text-[13px] font-bold flex justify-between items-center mb-2 ${colors[severity as keyof typeof colors]}`}>
      <span className="truncate pr-2 capitalize">{text}</span>
      <span className="bg-white/60 px-2 py-0.5 rounded-lg text-[10px] shadow-sm text-slate-800">{count} fallos</span>
    </div>
  );
};