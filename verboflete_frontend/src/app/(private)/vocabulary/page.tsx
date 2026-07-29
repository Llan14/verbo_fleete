"use client";

import { getClientToken } from "@/lib/authToken";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";

type GeneratedItem = {
  termino: string;
  traduccion: string;
  ejemplo: string;
};

type VocabularyItem = {
  id: number;
  termino: string;
  traduccion: string;
  ejemplo?: string | null;
  contexto?: string | null;
  nivel?: string | null;
  repeticiones: number;
  intervalo_dias: number;
  factor_facilidad: number;
  aciertos: number;
  errores: number;
  proximo_repaso: string;
};

type VocabularyStats = {
  total_palabras: number;
  pendientes_hoy: number;
  tasa_acierto: number;
  nivel_top: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function VocabularyPage() {
  const [nivel, setNivel] = useState("A1");
  const [contexto, setContexto] = useState("Viajes");
  const [cantidad, setCantidad] = useState(8);

  const [generated, setGenerated] = useState<GeneratedItem[]>([]);
  const [myWords, setMyWords] = useState<VocabularyItem[]>([]);
  const [dueWords, setDueWords] = useState<VocabularyItem[]>([]);
  const [stats, setStats] = useState<VocabularyStats | null>(null);

  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [filtroContexto, setFiltroContexto] = useState("");
  const [filtroTexto, setFiltroTexto] = useState("");

  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDue, setLoadingDue] = useState(false);
  const [error, setError] = useState("");

  const pendientes = useMemo(() => dueWords.length, [dueWords]);

  const authHeaders = () => {
    const token = getClientToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const loadMyWords = async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (filtroNivel !== "todos") params.set("nivel", filtroNivel);
      if (filtroContexto.trim()) params.set("contexto", filtroContexto.trim());
      if (filtroTexto.trim()) params.set("search", filtroTexto.trim());

      const queryString = params.toString();
      const endpoint = queryString ? `${API_URL}/vocabulary/my?${queryString}` : `${API_URL}/vocabulary/my`;
      const res = await fetch(endpoint, { headers: authHeaders() });
      if (!res.ok) throw new Error("No se pudo cargar tu vocabulario");
      const data: VocabularyItem[] = await res.json();
      setMyWords(data);
    } catch (e: any) {
      setError(e.message || "Error cargando vocabulario");
    } finally {
      setLoadingList(false);
    }
  };

  const loadDueWords = async () => {
    setLoadingDue(true);
    try {
      const res = await fetch(`${API_URL}/vocabulary/due`, { headers: authHeaders() });
      if (!res.ok) throw new Error("No se pudo cargar repaso");
      const data: VocabularyItem[] = await res.json();
      setDueWords(data);
    } catch (e: any) {
      setError(e.message || "Error cargando repaso");
    } finally {
      setLoadingDue(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_URL}/vocabulary/stats`, { headers: authHeaders() });
      if (!res.ok) throw new Error("No se pudo cargar métricas");
      const data: VocabularyStats = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    loadMyWords();
    loadDueWords();
    loadStats();
  }, []);

  useEffect(() => {
    loadMyWords();
  }, [filtroNivel, filtroContexto, filtroTexto]);

  const generateWords = async () => {
    setError("");
    setLoadingGenerate(true);
    try {
      const res = await fetch(`${API_URL}/vocabulary/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ nivel, contexto, cantidad }),
      });
      if (!res.ok) throw new Error("No se pudo generar vocabulario");
      const data = await res.json();
      setGenerated(data.items || []);
    } catch (e: any) {
      setError(e.message || "Error generando vocabulario");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const saveWord = async (word: GeneratedItem) => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/vocabulary/save`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          termino: word.termino,
          traduccion: word.traduccion,
          ejemplo: word.ejemplo,
          contexto,
          nivel,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la palabra");
      await Promise.all([loadMyWords(), loadDueWords(), loadStats()]);
    } catch (e: any) {
      setError(e.message || "Error guardando palabra");
    }
  };

  const reviewWord = async (itemId: number, calidad: number) => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/vocabulary/review`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ item_id: itemId, calidad }),
      });
      if (!res.ok) throw new Error("No se pudo registrar el repaso");
      await Promise.all([loadMyWords(), loadDueWords(), loadStats()]);
    } catch (e: any) {
      setError(e.message || "Error en repaso");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Vocabulario + Repaso Adaptativo</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Genera palabras por contexto y repasa con SRS (SM-2).</p>
        </div>
        <span className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md px-4 py-2 text-sm font-bold text-sky-700 dark:text-sky-300 shadow-sm">
          Pendientes hoy: {pendientes}
        </span>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard className="p-4">
            <p className="text-[11px] uppercase font-black text-slate-500 dark:text-slate-400">Total palabras</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total_palabras}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-[11px] uppercase font-black text-slate-500 dark:text-slate-400">Pendientes</p>
            <p className="text-2xl font-black text-sky-600 dark:text-sky-300 mt-1">{stats.pendientes_hoy}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-[11px] uppercase font-black text-slate-500 dark:text-slate-400">Tasa acierto</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-1">{stats.tasa_acierto}%</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-[11px] uppercase font-black text-slate-500 dark:text-slate-400">Nivel dominante</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.nivel_top}</p>
          </GlassCard>
        </div>
      )}

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-4 text-sm text-rose-800 dark:text-rose-200 backdrop-blur-md">{error}</div>}

      <GlassCard className="p-6 space-y-4">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Generador de vocabulario</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm cursor-pointer shadow-sm"
          >
            <option value="A1">A1</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>
          <input
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm md:col-span-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
            placeholder="Contexto (ej. trabajo, viajes, escuela)"
          />
          <input
            type="number"
            min={3}
            max={20}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm"
          />
        </div>
        <button
          onClick={generateWords}
          disabled={loadingGenerate}
          className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-sky-400 disabled:opacity-50 cursor-pointer shadow-lg shadow-sky-950/20"
        >
          {loadingGenerate ? "Generando..." : "Generar palabras"}
        </button>

        {generated.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 pt-2">
            {generated.map((word, idx) => (
              <div key={`${word.termino}-${idx}`} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 p-4">
                <p className="text-lg font-black text-slate-900 dark:text-white">{word.termino}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{word.traduccion}</p>
                <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">{word.ejemplo}</p>
                <button
                  onClick={() => saveWord(word)}
                  className="mt-3 rounded-xl border border-sky-500/20 dark:border-sky-400/30 bg-sky-500/10 dark:bg-sky-500/20 px-3.5 py-1.5 text-xs font-bold text-sky-800 dark:text-sky-200 hover:bg-sky-500/20 dark:hover:bg-sky-500/30 cursor-pointer"
                >
                  Guardar en mi lista
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6 space-y-4">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Repaso de hoy (SRS)</h2>
        {loadingDue ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando repaso...</p>
        ) : dueWords.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No tienes tarjetas pendientes ahora.</p>
        ) : (
          <div className="space-y-3">
            {dueWords.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 p-4">
                <p className="text-lg font-black text-slate-900 dark:text-white">{item.termino}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{item.traduccion}</p>
                {item.ejemplo && <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{item.ejemplo}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => reviewWord(item.id, 2)} className="rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 px-3.5 py-1.5 text-xs font-bold text-rose-800 dark:text-rose-200 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 cursor-pointer">Fallo</button>
                  <button onClick={() => reviewWord(item.id, 3)} className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/20 px-3.5 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 cursor-pointer">Dudoso</button>
                  <button onClick={() => reviewWord(item.id, 5)} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 cursor-pointer">Perfecto</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Mi banco de palabras</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-1.5 text-xs cursor-pointer outline-none shadow-sm"
            >
              <option value="todos">Todos</option>
              <option value="A1">A1</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
            <input
              value={filtroContexto}
              onChange={(e) => setFiltroContexto(e.target.value)}
              placeholder="Filtrar contexto"
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-1.5 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-sm"
            />
            <input
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar término"
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-1.5 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none shadow-sm"
            />
          </div>
        </div>
        {loadingList ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando palabras...</p>
        ) : myWords.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Todavía no has guardado palabras.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr] bg-slate-100 dark:bg-slate-950/60 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
              <span>Término</span>
              <span>Traducción</span>
              <span>Intervalo</span>
              <span>Próximo repaso</span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-white/5 bg-white/50 dark:bg-transparent">
              {myWords.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr] px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                  <span className="font-semibold text-slate-900 dark:text-white">{item.termino}</span>
                  <span>{item.traduccion}</span>
                  <span>{item.intervalo_dias} días</span>
                  <span>{new Date(item.proximo_repaso).toLocaleDateString("es-ES")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}