"use client";

import { getClientToken } from "@/lib/authToken";
import { useEffect, useMemo, useState } from "react";

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
      if (!res.ok) throw new Error("No se pudo cargar metricas");
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
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary">Vocabulario + Repaso Adaptativo</h1>
          <p className="text-sm text-text-muted">Genera palabras por contexto y repasa con SRS (SM-2).</p>
        </div>
        <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-primary">
          Pendientes hoy: {pendientes}
        </span>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase font-black text-text-muted">Total palabras</p>
            <p className="text-2xl font-black text-primary">{stats.total_palabras}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase font-black text-text-muted">Pendientes</p>
            <p className="text-2xl font-black text-primary">{stats.pendientes_hoy}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase font-black text-text-muted">Tasa acierto</p>
            <p className="text-2xl font-black text-primary">{stats.tasa_acierto}%</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase font-black text-text-muted">Nivel dominante</p>
            <p className="text-2xl font-black text-primary">{stats.nivel_top}</p>
          </div>
        </div>
      )}

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-primary">Generador de vocabulario</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2"
          >
            <option value="A1">A1</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </select>
          <input
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 md:col-span-2"
            placeholder="Contexto (ej. trabajo, viajes, escuela)"
          />
          <input
            type="number"
            min={3}
            max={20}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className="rounded-xl border border-border bg-background px-3 py-2"
          />
        </div>
        <button
          onClick={generateWords}
          disabled={loadingGenerate}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {loadingGenerate ? "Generando..." : "Generar palabras"}
        </button>

        {generated.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {generated.map((word, idx) => (
              <div key={`${word.termino}-${idx}`} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-lg font-black text-primary">{word.termino}</p>
                <p className="text-sm text-text-main">{word.traduccion}</p>
                <p className="mt-2 text-xs italic text-text-muted">{word.ejemplo}</p>
                <button
                  onClick={() => saveWord(word)}
                  className="mt-3 rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10"
                >
                  Guardar en mi lista
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-black text-primary">Repaso de hoy (SRS)</h2>
        {loadingDue ? (
          <p className="text-sm text-text-muted">Cargando repaso...</p>
        ) : dueWords.length === 0 ? (
          <p className="text-sm text-text-muted">No tienes tarjetas pendientes ahora.</p>
        ) : (
          <div className="space-y-3">
            {dueWords.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-lg font-black text-primary">{item.termino}</p>
                <p className="text-sm text-text-main">{item.traduccion}</p>
                {item.ejemplo && <p className="mt-1 text-xs italic text-text-muted">{item.ejemplo}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => reviewWord(item.id, 2)} className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">Fallo</button>
                  <button onClick={() => reviewWord(item.id, 3)} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">Dudoso</button>
                  <button onClick={() => reviewWord(item.id, 5)} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Perfecto</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-primary">Mi banco de palabras</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
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
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            />
            <input
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar termino"
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        {loadingList ? (
          <p className="text-sm text-text-muted">Cargando palabras...</p>
        ) : myWords.length === 0 ? (
          <p className="text-sm text-text-muted">Todavia no has guardado palabras.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr] bg-background px-4 py-3 text-xs font-black uppercase tracking-wide text-text-muted">
              <span>Termino</span>
              <span>Traduccion</span>
              <span>Intervalo</span>
              <span>Proximo repaso</span>
            </div>
            <div className="divide-y divide-border">
              {myWords.map((item) => (
                <div key={item.id} className="grid grid-cols-[1.2fr_1fr_0.8fr_1fr] px-4 py-3 text-sm text-text-main">
                  <span className="font-semibold text-primary">{item.termino}</span>
                  <span>{item.traduccion}</span>
                  <span>{item.intervalo_dias} dias</span>
                  <span>{new Date(item.proximo_repaso).toLocaleDateString("es-ES")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
