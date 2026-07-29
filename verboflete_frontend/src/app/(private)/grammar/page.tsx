"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect } from "react";
import ContextForm, { ContextData } from "@/components/ContextForm";
import { GlassCard } from "@/components/GlassCard";

interface OpcionHueco {
  texto: string;
  es_correcta: boolean;
}

interface Hueco {
  id_hueco: string;
  explicacion: string;
  opciones: OpcionHueco[];
}

interface GramaticaGenerateResponse {
  texto_con_huecos: string;
  huecos: Hueco[];
}

interface RespuestaUsuarioPayload {
  id_hueco: string;
  opcion_idx: number;
}

interface CalificarGramaticaResponse {
  score: number;
  aciertos: number;
  total: number;
  mensaje: string;
}

export default function GrammarPage() {
  const [config, setConfig] = useState<ContextData | null>(null);
  const [ejercicio, setEjercicio] = useState<GramaticaGenerateResponse | null>(null);
  const [respuestasUsuario, setRespuestasUsuario] = useState<Record<string, number>>({});
  const [gradeResult, setGradeResult] = useState<CalificarGramaticaResponse | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedState = sessionStorage.getItem("verboFlete_grammar_state");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setConfig(parsed.config);
        setEjercicio(parsed.ejercicio);
        setRespuestasUsuario(parsed.respuestasUsuario || {});
        setGradeResult(parsed.gradeResult);
      } catch (err) {
        console.error("Error leyendo la memoria:", err);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (config) {
        const stateToSave = { config, ejercicio, respuestasUsuario, gradeResult };
        sessionStorage.setItem("verboFlete_grammar_state", JSON.stringify(stateToSave));
      } else {
        sessionStorage.removeItem("verboFlete_grammar_state");
      }
    }
  }, [config, ejercicio, respuestasUsuario, gradeResult, isLoaded]);

  const handleGenerate = async (formData: ContextData) => {
    setIsGenerating(true);
    setError("");
    try {
      const token = getClientToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grammar/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Error al generar el ejercicio de gramática.");
      
      const data: GramaticaGenerateResponse = await res.json();
      
      const dataDesordenada = { ...data };
      dataDesordenada.huecos = dataDesordenada.huecos.map(hueco => {
        const opcionesMezcladas = [...hueco.opciones].sort(() => Math.random() - 0.5);
        return { ...hueco, opciones: opcionesMezcladas };
      });

      setConfig(formData);
      setEjercicio(dataDesordenada); 
      setRespuestasUsuario({});
      setGradeResult(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGrade = async () => {
    if (!ejercicio || !config) return;
    setIsGrading(true);
    setError("");

    const respuestasArray: RespuestaUsuarioPayload[] = Object.entries(respuestasUsuario).map(
      ([idHueco, opcIdx]) => ({
        id_hueco: idHueco,
        opcion_idx: opcIdx
      })
    );

    const jsonOriginalString = JSON.stringify(ejercicio);

    try {
      const token = getClientToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grammar/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          config: config,
          respuestas_usuario: respuestasArray,
          json_original: jsonOriginalString
        })
      });

      if (!res.ok) throw new Error("Error al calificar el ejercicio.");
      
      const data: CalificarGramaticaResponse = await res.json();
      setGradeResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGrading(false);
    }
  };

  const handleSelectChange = (idHueco: string, opcionIdx: number) => {
    if (gradeResult) return;
    setRespuestasUsuario(prev => ({
      ...prev,
      [idHueco]: opcionIdx
    }));
  };

  const handleReset = () => {
    sessionStorage.removeItem("verboFleteContext");
    sessionStorage.removeItem("verboFlete_grammar_state");
    setConfig(null);
    setEjercicio(null);
    setRespuestasUsuario({});
    setGradeResult(null);
  };

  const renderTextoConHuecos = () => {
    if (!ejercicio) return null;

    const partes = ejercicio.texto_con_huecos.split(/(\[BLANK_\d+\])/g);

    return (
      <p className="text-xl leading-loose text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-medium">
        {partes.map((parte, index) => {
          if (/\[BLANK_\d+\]/.test(parte)) {
            return (
              <span key={index} className="inline-block min-w-[4rem] bg-sky-500/10 dark:bg-sky-500/20 px-2 py-1 mx-1 rounded-md border-b-2 border-sky-500 dark:border-sky-400 text-sky-700 dark:text-sky-200 align-baseline text-center font-bold">
                &nbsp;
              </span>
            );
          }
          return <span key={index}>{parte}</span>;
        })}
      </p>
    );
  };

  const todosRespondidos = ejercicio ? Object.keys(respuestasUsuario).length === ejercicio.huecos.length : false;

  if (!isLoaded) return <div className="w-full min-h-[70vh]"></div>;

  if (!config) {
    return (
      <div className="flex items-center justify-center p-4 md:p-6">
        <div className="max-w-4xl w-full">
          <GlassCard className="p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">🧩 Gramática en Contexto</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base mb-8">Rellena los huecos en la historia eligiendo la opción correcta (verbos, preposiciones y artículos).</p>
            
            {error && <p className="text-rose-500 dark:text-rose-400 font-bold text-center mb-4">{error}</p>}
            
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-700 dark:text-slate-300 font-bold animate-pulse">Armando el rompecabezas gramatical...</p>
              </div>
            ) : (
              <ContextForm onGenerate={handleGenerate} />
            )}
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col font-sans animate-in fade-in duration-500 space-y-6">
      <header className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex justify-between items-center shadow-lg">
        <button onClick={handleReset} className="text-rose-600 dark:text-rose-400 font-bold text-sm hover:text-rose-500 dark:hover:text-rose-300 transition-colors cursor-pointer">
          ✕ Terminar Sesión
        </button>
        <div className="flex gap-2">
          <span className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
            {config.mood}
          </span>
          <span className="bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 text-sky-700 dark:text-sky-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full">
            {config.tense}
          </span>
        </div>
      </header>

      <main className="space-y-6">
        <GlassCard className="p-6 md:p-8">
          <h2 className="text-xs font-black uppercase text-sky-600 dark:text-sky-400 tracking-widest mb-6">Complète l'histoire</h2>
          {renderTextoConHuecos()}
        </GlassCard>

        {/* Preguntas de opción múltiple */}
        <div className="space-y-6">
          {ejercicio?.huecos.map((hueco, idx) => {
            const letras = ['A', 'B', 'C', 'D'];
            return (
              <GlassCard key={hueco.id_hueco} className="p-6">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <span className="bg-sky-500 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-xs font-black">{idx + 1}</span>
                  Completa el hueco
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hueco.opciones.map((opcion, oIdx) => {
                    const isSelected = respuestasUsuario[hueco.id_hueco] === oIdx;
                    const isCorrect = opcion.es_correcta;

                    let buttonClasses = "w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 text-base cursor-pointer ";

                    if (gradeResult) {
                      if (isCorrect) {
                        buttonClasses += " bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500 dark:border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold";
                      } else if (isSelected && !isCorrect) {
                        buttonClasses += " bg-rose-500/10 dark:bg-rose-500/20 border-rose-500 dark:border-rose-400 text-rose-800 dark:text-rose-200 font-bold line-through";
                      } else {
                        buttonClasses += " bg-slate-100 dark:bg-slate-950/20 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50";
                      }
                    } else {
                      if (isSelected) {
                        buttonClasses += " bg-sky-500/20 dark:bg-sky-500/30 border-sky-500 dark:border-sky-400 text-slate-900 dark:text-white font-bold ring-2 ring-sky-400/40 shadow-lg shadow-sky-950/20";
                      } else {
                        buttonClasses += " bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-800 dark:text-slate-200";
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectChange(hueco.id_hueco, oIdx)}
                        disabled={gradeResult !== null}
                        className={buttonClasses}
                      >
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full font-bold text-sm inline-flex items-center justify-center ${isSelected && !gradeResult ? 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950' : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
                          {letras[oIdx]}
                        </span>
                        <span>{opcion.texto}</span>
                      </button>
                    );
                  })}
                </div>
                {gradeResult && (
                  <div className="mt-5 p-4 bg-sky-500/10 border border-sky-500/20 dark:border-sky-400/30 rounded-xl text-sm text-sky-900 dark:text-sky-200 backdrop-blur-md">
                    <p><span className="font-bold">💡 Explicación:</span> {hueco.explicacion}</p>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>

        {/* Botón Evaluar o Resultados */}
        {!gradeResult ? (
          <div className="flex flex-col items-end pt-2">
            <button
              onClick={handleGrade}
              disabled={!todosRespondidos || isGrading}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg shadow-sky-950/20 w-full sm:w-auto cursor-pointer"
            >
              {isGrading ? "Evaluando..." : "Evaluar Ejercicio"}
            </button>
            {!todosRespondidos && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Rellena todos los huecos para continuar.</p>
            )}
            {error && <p className="text-rose-500 dark:text-rose-400 font-bold mt-2">{error}</p>}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <GlassCard className={`p-8 text-center border ${gradeResult.score >= 80 ? 'border-emerald-500/40 dark:border-emerald-400/40 bg-emerald-500/10' : 'border-amber-500/40 dark:border-amber-400/40 bg-amber-500/10'}`}>
              <div className="text-6xl mb-4">{gradeResult.score >= 80 ? "🏆" : "💪"}</div>
              <h2 className={`text-3xl font-black mb-2 ${gradeResult.score >= 80 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                Calificación: {gradeResult.score.toFixed(0)}%
              </h2>
            </GlassCard>
            
            <div className="flex justify-center pt-2">
              <button 
                onClick={() => handleGenerate(config!)} 
                disabled={isGenerating}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-10 py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center min-w-[250px] cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Generando ejercicio...
                  </>
                ) : (
                  "Generar Nuevo Ejercicio"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}