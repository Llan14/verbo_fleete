"use client";

import { useState, useEffect } from "react";
import ContextForm, { ContextData } from "@/components/ContextForm";

interface OpcionQuiz {
  texto: string;
  es_correcta: boolean;
}

interface PreguntaQuiz {
  pregunta: string;
  opciones: OpcionQuiz[];
}

interface ReadingGenerateResponse {
  texto_frances: string;
  preguntas: PreguntaQuiz[];
}

interface RespuestaUsuarioPayload {
  pregunta_idx: number;
  opcion_idx: number;
}

interface CalificarReadingResponse {
  score: number;
  aciertos: number;
}

export default function ReadingQuizPage() {
  const [config, setConfig] = useState<ContextData | null>(null);
  const [lectura, setLectura] = useState<ReadingGenerateResponse | null>(null);
  
  const [respuestasUsuario, setRespuestasUsuario] = useState<Record<number, number>>({});
  const [gradeResult, setGradeResult] = useState<CalificarReadingResponse | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedState = sessionStorage.getItem("verboFlete_reading_quiz_state");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setConfig(parsed.config);
        setLectura(parsed.lectura);
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
        const stateToSave = { config, lectura, respuestasUsuario, gradeResult };
        sessionStorage.setItem("verboFlete_reading_quiz_state", JSON.stringify(stateToSave));
      } else {
        sessionStorage.removeItem("verboFlete_reading_quiz_state");
      }
    }
  }, [config, lectura, respuestasUsuario, gradeResult, isLoaded]);

  const handleGenerate = async (formData: ContextData) => {
    setIsGenerating(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reading/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Error al generar el texto de lectura.");
      
      const data: ReadingGenerateResponse = await res.json();
      
      const dataDesordenada = { ...data };
      dataDesordenada.preguntas = dataDesordenada.preguntas.map(preg => {
        const opcionesMezcladas = [...preg.opciones].sort(() => Math.random() - 0.5);
        return { ...preg, opciones: opcionesMezcladas };
      });

      setConfig(formData);
      setLectura(dataDesordenada);
      setRespuestasUsuario({});
      setGradeResult(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGrade = async () => {
    if (!lectura || !config) return;
    setIsGrading(true);
    setError("");

    const respuestasArray: RespuestaUsuarioPayload[] = Object.entries(respuestasUsuario).map(
      ([pregIdx, opcIdx]) => ({
        pregunta_idx: parseInt(pregIdx),
        opcion_idx: opcIdx
      })
    );

    const jsonOriginalString = JSON.stringify(lectura);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reading/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          config: config,
          respuestas_usuario: respuestasArray,
          json_original: jsonOriginalString
        })
      });

      if (!res.ok) throw new Error("Error al calificar el ejercicio.");
      
      const data: CalificarReadingResponse = await res.json();
      setGradeResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGrading(false);
    }
  };

  const handleOptionSelect = (preguntaIdx: number, opcionIdx: number) => {
    if (gradeResult) return;
    setRespuestasUsuario(prev => ({
      ...prev,
      [preguntaIdx]: opcionIdx
    }));
  };

  const handleReset = () => {
    sessionStorage.removeItem("verboFleteContext");
    sessionStorage.removeItem("verboFlete_reading_quiz_state");
    setConfig(null);
    setLectura(null);
    setRespuestasUsuario({});
    setGradeResult(null);
  };

  const todasRespondidas = lectura ? Object.keys(respuestasUsuario).length === lectura.preguntas.length : false;

  if (!isLoaded) return <div className="w-full h-dvh bg-background"></div>;

  if (!config) {
    return (
      <div className="flex items-center justify-center bg-background p-6">
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl font-black text-primary mb-2">📖 Comprensión Lectora</h1>
          <p className="text-text-muted mb-8">Lee el texto generado por la IA y responde las preguntas para evaluar tu comprensión.</p>
          
          {error && <p className="text-rose-600 font-bold text-center mb-4">{error}</p>}
          
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-text-muted font-bold animate-pulse">Escribiendo tu texto en francés...</p>
            </div>
          ) : (
            <ContextForm onGenerate={handleGenerate} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-background overflow-hidden">
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
          
          {/* SECCIÓN DEL TEXTO */}
          {lectura && (
            <div className="bg-white border border-border rounded-3xl p-6 md:p-10 shadow-sm">
              <h2 className="text-xs font-black uppercase text-text-muted tracking-widest mb-4">Texte à lire</h2>
              <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap font-medium">
                {lectura.texto_frances}
              </div>
            </div>
          )}

          {/* SECCIÓN DEL QUIZ */}
          {lectura && lectura.preguntas.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-primary border-b border-border pb-2">Questions</h3>
              
              {lectura.preguntas.map((item, pIdx) => {
                const letras = ['A', 'B', 'C', 'D'];
                return (
                  <div key={pIdx} className="bg-white border border-border rounded-3xl p-6 shadow-sm">
                    <p className="text-lg font-bold text-primary mb-4">
                      <span className="bg-primary text-white rounded-full w-7 h-7 inline-flex items-center justify-center mr-2 text-sm">{pIdx + 1}</span>
                      {item.pregunta}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {item.opciones.map((opcion, oIdx) => {
                        const isSelected = respuestasUsuario[pIdx] === oIdx;
                        const isCorrect = opcion.es_correcta;
                        
                        let buttonClasses = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-base";

                        if (gradeResult) { // After grading
                          if (isCorrect) {
                            buttonClasses += " bg-green-100 border-green-500 text-green-800 font-bold";
                          } else if (isSelected && !isCorrect) {
                            buttonClasses += " bg-rose-100 border-rose-500 text-rose-800 font-bold line-through";
                          } else {
                            buttonClasses += " bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed opacity-60";
                          }
                        } else { // Before grading
                          if (isSelected) {
                            buttonClasses += " bg-primary border-primary-dark text-white font-bold shadow-lg ring-2 ring-offset-2 ring-primary";
                          } else {
                            buttonClasses += " bg-white hover:bg-indigo-50 hover:border-primary-light border-gray-300 text-gray-800";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleOptionSelect(pIdx, oIdx)}
                            disabled={gradeResult !== null}
                            className={buttonClasses}
                          >
                            <span className={`flex-shrink-0 w-7 h-7 rounded-full font-bold text-sm inline-flex items-center justify-center ${isSelected && !gradeResult ? 'bg-white text-primary' : 'bg-gray-200 text-gray-600'}`}>
                              {letras[oIdx]}
                            </span>
                            <span>{opcion.texto}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* BOTÓN DE CALIFICAR O RESULTADOS */}
              {!gradeResult ? (
                <div className="flex flex-col items-end pt-4">
                  <button
                    onClick={handleGrade}
                    disabled={!todasRespondidas || isGrading}
                    className="bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-md w-full sm:w-auto"
                  >
                    {isGrading ? "Evaluando..." : "Evaluar Respuestas"}
                  </button>
                  {error && <p className="text-rose-600 font-bold mt-2">{error}</p>}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <div className={`p-8 rounded-3xl text-center shadow-md mb-6 border ${gradeResult.score >= 80 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="text-6xl mb-4">{gradeResult.score >= 80 ? "🏆" : "💪"}</div>
                    <h2 className={`text-3xl font-black mb-2 ${gradeResult.score >= 80 ? 'text-green-800' : 'text-amber-800'}`}>
                      Calificación: {gradeResult.score.toFixed(0)}%
                    </h2>
                    <p className="text-lg font-medium opacity-80">
                      Acertaste {gradeResult.aciertos} de {lectura.preguntas.length} preguntas.
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
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
          )}
        </div>
      </main>
    </div>
  );
}