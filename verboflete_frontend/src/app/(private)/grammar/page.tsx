"use client";

import { useState, useEffect } from "react";
import ContextForm, { ContextData } from "@/components/ContextForm";

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
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grammar/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Error al generar el ejercicio de gramática.");
      
      const data: GramaticaGenerateResponse = await res.json();
      
      const dataDesordenada = { ...data };
      dataDesordenada.huecos = dataDesordenada.huecos.map(hueco => {
        // Clonamos el array de opciones y lo desordenamos al azar
        const opcionesMezcladas = [...hueco.opciones].sort(() => Math.random() - 0.5);
        return { ...hueco, opciones: opcionesMezcladas };
      });

      setConfig(formData);
      // Guardamos la versión ya mezclada, así el backend evalúa sobre esta misma
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
      const token = localStorage.getItem("token");
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

  const renderTextoInteractivo = () => {
    if (!ejercicio) return null;

    const partes = ejercicio.texto_con_huecos.split(/(\[BLANK_\d+\])/g);

    return (
      <div className="text-xl leading-loose text-gray-800 whitespace-pre-wrap font-medium">
        {partes.map((parte, index) => {
          const hueco = ejercicio.huecos.find(h => h.id_hueco === parte);
          
          if (hueco) {
            const hasAnswered = respuestasUsuario[hueco.id_hueco] !== undefined;
            const selectedIdx = respuestasUsuario[hueco.id_hueco] ?? "";
            
            let bgColor = "bg-gray-100 border-gray-300";
            let textColor = "text-gray-800";
            
            if (gradeResult) {
              const idxCorrecta = hueco.opciones.findIndex(o => o.es_correcta === true);
              if (selectedIdx === idxCorrecta && idxCorrecta !== -1) {
                bgColor = "bg-green-100 border-green-500";
                textColor = "text-green-800 font-bold";
              } else {
                bgColor = "bg-rose-100 border-rose-500";
                textColor = "text-rose-800 font-bold";
              }
            } else if (hasAnswered) {
              bgColor = "bg-indigo-50 border-primary";
              textColor = "text-primary font-bold";
            }

            return (
              <select
                key={index}
                value={selectedIdx}
                onChange={(e) => handleSelectChange(hueco.id_hueco, parseInt(e.target.value))}
                disabled={gradeResult !== null}
                className={`mx-2 px-3 py-1 rounded-lg border-b-2 outline-none appearance-none cursor-pointer transition-colors shadow-sm text-center ${bgColor} ${textColor}`}
              >
                <option value="" disabled>___</option>
                {hueco.opciones.map((opcion, oIdx) => (
                  <option key={oIdx} value={oIdx}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
            );
          }
          
          return <span key={index}>{parte}</span>;
        })}
      </div>
    );
  };

  const todosRespondidos = ejercicio ? Object.keys(respuestasUsuario).length === ejercicio.huecos.length : false;

  if (!isLoaded) return <div className="w-full h-dvh bg-background"></div>;

  if (!config) {
    return (
      <div className="flex items-center justify-center bg-background p-6">
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl font-black text-primary mb-2">🧩 Gramática en Contexto</h1>
          <p className="text-text-muted mb-8">Rellena los huecos en la historia eligiendo la opción correcta (verbos, preposiciones y artículos).</p>
          
          {error && <p className="text-rose-600 font-bold text-center mb-4">{error}</p>}
          
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-text-muted font-bold animate-pulse">Armando el rompecabezas gramatical...</p>
            </div>
          ) : (
            <ContextForm onGenerate={handleGenerate} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-dvh flex flex-col bg-background overflow-hidden">
      <header className="bg-surface border-b border-border p-4 shrink-0 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button onClick={handleReset} className="text-rose-500 font-bold text-sm hover:underline">
            ✕ Terminar Sesión
          </button>
          <div className="flex gap-2">
            <span className="bg-background text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-border">
              {config.mood}
            </span>
            <span className="bg-menu-active text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">
              {config.tense}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="bg-white border border-border rounded-3xl p-6 md:p-10 shadow-sm">
            <h2 className="text-xs font-black uppercase text-text-muted tracking-widest mb-6">Complète l'histoire</h2>
            {renderTextoInteractivo()}
          </div>

          {!gradeResult ? (
            <div className="flex flex-col items-end pt-4">
              <button
                onClick={handleGrade}
                disabled={!todosRespondidos || isGrading}
                className="bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-md w-full sm:w-auto"
              >
                {isGrading ? "Evaluando..." : "Evaluar Ejercicio"}
              </button>
              {!todosRespondidos && (
                <p className="text-sm text-text-muted mt-2">Rellena todos los huecos para continuar.</p>
              )}
              {error && <p className="text-rose-600 font-bold mt-2">{error}</p>}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className={`p-8 rounded-3xl text-center shadow-md border ${gradeResult.score >= 80 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="text-6xl mb-4">{gradeResult.score >= 80 ? "🏆" : "💪"}</div>
                <h2 className={`text-3xl font-black mb-2 ${gradeResult.score >= 80 ? 'text-green-800' : 'text-amber-800'}`}>
                  Calificación: {gradeResult.score.toFixed(0)}%
                </h2>
                <p className="text-lg font-medium opacity-80">
                  Acertaste {gradeResult.aciertos} de {gradeResult.total} huecos.
                </p>
              </div>

              {/* FEEDBACK DETALLADO BLINDADO CONTRA ERRORES */}
              <div className="bg-white border border-border rounded-3xl p-6 md:p-8 shadow-sm">
                <h3 className="text-xl font-black text-primary mb-6 border-b pb-2">Correcciones y Explicaciones</h3>
                <div className="space-y-4">
                  {ejercicio?.huecos.map((hueco, idx) => {
                    // Usamos .find para buscar la correcta por si el índice falla
                    const opcionCorrecta = hueco.opciones.find(o => o.es_correcta === true);
                    const selectedIdx = respuestasUsuario[hueco.id_hueco];
                    const isCorrect = selectedIdx !== undefined && hueco.opciones[selectedIdx]?.es_correcta === true;
                    
                    return (
                      <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-rose-50 border-rose-200'}`}>
                        <p className="font-bold text-gray-800 mb-1">
                          Hueco {idx + 1}: <span className={isCorrect ? "text-green-700" : "text-rose-700 line-through mr-2"}>
                            {/* Verificación súper segura por si el array se corrompe */}
                            {selectedIdx !== undefined && hueco.opciones[selectedIdx]?.texto 
                              ? hueco.opciones[selectedIdx].texto 
                              : "No respondido"}
                          </span>
                          {!isCorrect && opcionCorrecta?.texto && (
                            <span className="text-green-700">✓ {opcionCorrecta.texto}</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 italic">💡 {hueco.explicacion || "Revisa la gramática."}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => handleGenerate(config!)} 
                  disabled={isGenerating}
                  className="bg-menu-active hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold px-10 py-4 rounded-xl shadow-md transition-colors flex items-center justify-center min-w-[250px]"
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
        </div>
      </main>
    </div>
  );
}