"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ContextForm from "@/components/ContextForm";
import { GlassCard } from "@/components/GlassCard";

interface CorreccionChat {
  error: string;
  correccion: string;
  explicacion: string;
}

interface MensajeChat {
  role: "user" | "assistant";
  content: string;
  correcciones?: CorreccionChat[];
}

interface ChatTurnResponse {
  respuesta_chat: string;
  correcciones: CorreccionChat[];
}

interface ChatGradeResponse {
  score: number;
  feedback: string;
  exerciseComplete: boolean;
}

export default function WritingChatPage() {
  const router = useRouter();

  const [config, setConfig] = useState<any>(null);
  const [escenario, setEscenario] = useState("");
  const [historial, setHistorial] = useState<MensajeChat[]>([]);
  const [gradeResult, setGradeResult] = useState<ChatGradeResponse | null>(null);
  const [isCorrectionEnabled, setIsCorrectionEnabled] = useState(true);
  
  const [mensajeActual, setMensajeActual] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState("");

  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.removeItem("chatHistoryWriting");
    sessionStorage.removeItem("chatConfigWriting");
    sessionStorage.removeItem("chatEscenarioWriting");

    const savedState = sessionStorage.getItem("verboFlete_writing_state");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setConfig(parsed.config);
        setEscenario(parsed.escenario);
        setHistorial(parsed.historial || []);
        setGradeResult(parsed.gradeResult);
        setIsCorrectionEnabled(parsed.isCorrectionEnabled ?? true);
      } catch (err) {
        console.error("Error leyendo la memoria de writing:", err);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (config) {
        const stateToSave = {
          config,
          escenario,
          historial,
          gradeResult,
          isCorrectionEnabled
        };
        sessionStorage.setItem("verboFlete_writing_state", JSON.stringify(stateToSave));
      } else {
        sessionStorage.removeItem("verboFlete_writing_state");
      }
    }
  }, [config, escenario, historial, gradeResult, isCorrectionEnabled, isLoaded]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historial, isSending, gradeResult]);

  const handleStartChat = async (formData: any) => {
    setIsGeneratingContext(true);
    setError("");
    try {
      const token = getClientToken();
      if (!token) {
        throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/generate-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 401) {
          throw new Error("Sesión no válida o expirada. Vuelve a iniciar sesión.");
        }
        throw new Error(errData?.detail || "Error al generar el escenario.");
      }

      const data = await res.json();
      
      setConfig(formData);
      setEscenario(data.escenario);
      setHistorial([{ role: "assistant", content: data.primer_mensaje }]);
      setGradeResult(null);
    } catch (err: any) {
      setError(err.message || "Error al generar el escenario.");
      if ((err.message || "").includes("Sesión")) {
        router.push("/login");
      }
    } finally {
      setIsGeneratingContext(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mensajeActual.trim() || isSending) return;

    const textoUsuario = mensajeActual;
    setMensajeActual(""); 
    
    const nuevoHistorial = [...historial, { role: "user" as const, content: textoUsuario }];
    setHistorial(nuevoHistorial);
    setIsSending(true);
    setError("");

    const historialLimpio = nuevoHistorial.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const token = getClientToken();
      if (!token) {
        throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          config: config,
          message: textoUsuario,
          messageHistory: historialLimpio,
          gradeExercise: false
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 401) {
          throw new Error("Sesión no válida o expirada. Vuelve a iniciar sesión.");
        }
        throw new Error(errData?.detail || "Error en la respuesta del servidor");
      }

      const data: ChatTurnResponse = await res.json();
      setHistorial(prev => [...prev, { role: "assistant", content: data.respuesta_chat, correcciones: data.correcciones }]);
    } catch (err: any) {
      setError(err.message || "Error al enviar el mensaje.");
      if ((err.message || "").includes("Sesión")) {
        router.push("/login");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleGradeExercise = async () => {
    setIsGrading(true);
    setError("");

    const historialLimpio = historial.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const token = getClientToken();
      if (!token) {
        throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          config: config,
          message: "",
          messageHistory: historialLimpio,
          gradeExercise: true
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 401) {
          throw new Error("Sesión no válida o expirada. Vuelve a iniciar sesión.");
        }
        throw new Error(errData?.detail || "Error al calificar");
      }

      const data: ChatGradeResponse = await res.json();
      setGradeResult(data);
    } catch (err: any) {
      setError(err.message || "Error al calificar.");
      if ((err.message || "").includes("Sesión")) {
        router.push("/login");
      }
    } finally {
      setIsGrading(false);
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem("verboFleteContext");
    sessionStorage.removeItem("verboFlete_writing_state");
    setConfig(null);
    setEscenario("");
    setHistorial([]);
    setGradeResult(null);
  };

  if (!isLoaded) {
    return <div className="w-full min-h-[70vh]"></div>;
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center p-4 md:p-6 font-sans">
        <div className="max-w-3xl w-full">
          <GlassCard className="p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">✍️ Chat de Rol</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base mb-8">Practica tu escritura con escenarios reales.</p>
            {isGeneratingContext ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sky-600 dark:text-sky-300 font-bold animate-pulse">Creando escenario...</p>
              </div>
            ) : (
              <ContextForm onGenerate={handleStartChat} />
            )}
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-5rem)] flex flex-col font-sans space-y-4">
      <header className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-4 rounded-2xl shrink-0 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={handleReset} className="text-rose-600 dark:text-rose-400 font-bold text-sm hover:text-rose-500 dark:hover:text-rose-300 transition-colors cursor-pointer">
            ✕ Terminar Sesión
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCorrectionEnabled(!isCorrectionEnabled)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-colors border cursor-pointer ${
                isCorrectionEnabled ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10"
              }`}
            >
              💡 Correcciones: {isCorrectionEnabled ? "ON" : "OFF"}
            </button>

            <div className="flex gap-2">
              <span className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">{config.mood}</span>
              <span className="bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 text-sky-700 dark:text-sky-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full">{config.tense}</span>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-3 bg-sky-500/10 border border-sky-500/20 dark:border-sky-400/20 p-3 rounded-xl text-sky-900 dark:text-sky-200 text-xs backdrop-blur-md">
          <strong>🎬 Escenario:</strong> {escenario}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2 sm:p-4 scroll-smooth space-y-4">
        <div className="max-w-5xl mx-auto space-y-4">
          {historial.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`p-4 max-w-[85%] sm:max-w-[70%] rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-sky-500 text-white rounded-br-none shadow-lg shadow-sky-950/20" 
                  : "bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-bl-none backdrop-blur-md shadow-md"
              }`}>
                {msg.content}
              </div>
              
              {isCorrectionEnabled && msg.role === "assistant" && msg.correcciones?.map((c, i) => (
                <div key={i} className="mt-2 w-full max-w-[85%] sm:max-w-[70%] bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-amber-900 dark:text-amber-200 text-xs backdrop-blur-md space-y-1">
                  <p className="text-rose-600 dark:text-rose-400 line-through font-medium">{c.error}</p>
                  <p className="text-emerald-700 dark:text-emerald-300 font-bold">✨ {c.correccion}</p>
                  <p className="italic text-amber-900/80 dark:text-amber-200/80 bg-white/40 dark:bg-black/20 p-2 rounded-lg">{c.explicacion}</p>
                </div>
              ))}
            </div>
          ))}
          {isSending && (
            <div className="flex items-start">
              <div className="p-4 bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl rounded-bl-none flex gap-2 items-center">
                <div className="w-2 h-2 bg-sky-500 dark:bg-sky-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-sky-500 dark:bg-sky-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-sky-500 dark:bg-sky-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={mensajesEndRef} />
        </div>
      </main>

      <footer className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 p-4 rounded-2xl shrink-0">
        <div className="max-w-5xl mx-auto">
          {!gradeResult ? (
            <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
              <input
                value={mensajeActual}
                onChange={(e) => setMensajeActual(e.target.value)}
                placeholder="Écris ta réponse ici..."
                className="flex-1 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm"
                disabled={isSending || isGrading}
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={!mensajeActual.trim() || isSending || isGrading}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg cursor-pointer text-sm"
                >
                  Enviar 🚀
                </button>
                {historial.length > 2 && (
                  <button 
                    type="button" 
                    onClick={handleGradeExercise} 
                    disabled={isSending || isGrading}
                    className="bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 font-bold px-5 py-3 rounded-xl transition-all text-sm cursor-pointer whitespace-nowrap"
                  >
                    {isGrading ? "Evaluando..." : "✅ Evaluar"}
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <GlassCard className={`p-6 text-center border ${gradeResult.score >= 80 ? 'border-emerald-500/40 dark:border-emerald-400/40 bg-emerald-500/10' : 'border-amber-500/40 dark:border-amber-400/40 bg-amber-500/10'}`}>
                <h2 className={`text-2xl font-black mb-2 ${gradeResult.score >= 80 ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                  Calificación Final: {gradeResult.score}/100
                </h2>
                <p className="italic text-base text-slate-700 dark:text-slate-200">"{gradeResult.feedback}"</p>
              </GlassCard>
              <div className="flex justify-center mt-4">
                <button 
                  onClick={handleReset} 
                  className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all text-sm cursor-pointer"
                >
                  Volver a configurar
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-rose-500 dark:text-rose-400 font-bold text-center mt-2 text-xs">{error}</p>}
        </div>
      </footer>
    </div>
  );
}