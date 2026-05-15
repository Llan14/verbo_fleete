"use client";

import { useState, useRef, useEffect } from "react";
import ContextForm from "@/components/ContextForm";

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
  // Estados principales
  const [config, setConfig] = useState<any>(null);
  const [escenario, setEscenario] = useState("");
  const [historial, setHistorial] = useState<MensajeChat[]>([]);
  const [gradeResult, setGradeResult] = useState<ChatGradeResponse | null>(null);
  const [isCorrectionEnabled, setIsCorrectionEnabled] = useState(true);
  
  // Estados de UI
  const [mensajeActual, setMensajeActual] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState("");

  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // 1. CARGA INICIAL UNIFICADA
  useEffect(() => {
    // Limpiamos las llaves viejas si existen para no dejar basura
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

  // 2. AUTOGUARDADO UNIFICADO
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

  // Scroll automático hacia abajo en el chat
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historial, isSending, gradeResult]);

  const handleStartChat = async (formData: any) => {
    setIsGeneratingContext(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/generate-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Error al generar el escenario.");
      const data = await res.json();
      
      setConfig(formData);
      setEscenario(data.escenario);
      setHistorial([{ role: "assistant", content: data.primer_mensaje }]);
      setGradeResult(null);
    } catch (err: any) {
      setError(err.message);
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

    const historialLimpio = nuevoHistorial.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          config: config,
          message: textoUsuario,
          messageHistory: historialLimpio, // <-- Usamos el historial limpio
          gradeExercise: false
        })
      });

      if (!res.ok) throw new Error("Error en la respuesta del servidor");

      const data: ChatTurnResponse = await res.json();
      setHistorial(prev => [...prev, { role: "assistant", content: data.respuesta_chat, correcciones: data.correcciones }]);
    } catch (err: any) {
      setError("Error al enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  const handleGradeExercise = async () => {
    setIsGrading(true);

    // 🔥 TAMBIÉN LIMPIAMOS AQUÍ PARA LA CALIFICACIÓN FINAL
    const historialLimpio = historial.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          config: config,
          message: "",
          messageHistory: historialLimpio, // <-- Usamos el historial limpio
          gradeExercise: true
        })
      });

      if (!res.ok) throw new Error("Error al calificar");

      const data: ChatGradeResponse = await res.json();
      setGradeResult(data);
    } catch {
      setError("Error al calificar.");
    } finally {
      setIsGrading(false);
    }
  };

  // 🔥 ARREGLADO: Ya no borra la memoria de los demás módulos
  const handleReset = () => {
    sessionStorage.removeItem("verboFleteContext");
    sessionStorage.removeItem("verboFlete_writing_state");
    setConfig(null);
    setEscenario("");
    setHistorial([]);
    setGradeResult(null);
  };

  if (!isLoaded) {
    return <div className="w-full h-dvh bg-background"></div>;
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center bg-background p-6">
        <div className="max-w-3xl w-full">
          <h1 className="text-4xl font-black text-primary mb-2">✍️ Chat de Rol</h1>
          <p className="text-text-muted mb-8">Practica tu escritura con escenarios reales.</p>
          {isGeneratingContext ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-primary font-bold animate-pulse">Creando escenario...</p>
            </div>
          ) : (
            <ContextForm onGenerate={handleStartChat} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-dvh flex flex-col bg-background">
      <header className="bg-surface border-b border-border p-4 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <button onClick={handleReset} className="text-rose-500 font-bold text-sm hover:underline">
            ✕ Terminar Sesión
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCorrectionEnabled(!isCorrectionEnabled)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-colors border ${
                isCorrectionEnabled ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-gray-100 text-gray-400 border-gray-200"
              }`}
            >
              💡 Correcciones: {isCorrectionEnabled ? "ON" : "OFF"}
            </button>

            <div className="flex gap-2">
              <span className="bg-background text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-border">{config.mood}</span>
              <span className="bg-menu-active text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">{config.tense}</span>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-3 bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-indigo-900 text-xs shadow-sm">
          <strong>🎬 Escenario:</strong> {escenario}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-6">
          {historial.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`p-4 max-w-[85%] sm:max-w-[70%] rounded-2xl shadow-sm ${msg.role === "user" ? "bg-primary text-white rounded-br-none" : "bg-white border border-border rounded-bl-none"}`}>
                {msg.content}
              </div>
              
              {isCorrectionEnabled && msg.role === "assistant" && msg.correcciones?.map((c, i) => (
                <div key={i} className="mt-2 w-full max-w-[85%] sm:max-w-[70%] bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <p className="text-rose-600 line-through text-sm font-medium mb-1">{c.error}</p>
                  <p className="text-green-700 font-bold text-sm mb-2">✨ {c.correccion}</p>
                  <p className="text-xs italic text-amber-900/80 bg-amber-100/50 p-2 rounded-lg">{c.explicacion}</p>
                </div>
              ))}
            </div>
          ))}
          {isSending && (
            <div className="flex items-start">
              <div className="p-4 bg-white border border-border rounded-2xl rounded-bl-none shadow-sm flex gap-2 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={mensajesEndRef} />
        </div>
      </main>

      <footer className="bg-surface border-t border-border p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto">
          {!gradeResult ? (
            <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
              <input
                value={mensajeActual}
                onChange={(e) => setMensajeActual(e.target.value)}
                placeholder="Écris ta réponse ici..."
                className="flex-1 p-4 rounded-xl border border-border bg-background focus:outline-none focus:border-primary shadow-inner"
                disabled={isSending || isGrading}
                autoFocus
              />
              <div className="flex gap-2 h-[58px]">
                <button 
                  type="submit" 
                  disabled={!mensajeActual.trim() || isSending || isGrading}
                  className="bg-primary hover:bg-primary-hover disabled:bg-gray-400 text-white px-8 rounded-xl font-bold transition-colors shadow-md flex-1 sm:flex-none flex items-center justify-center"
                >
                  Enviar 🚀
                </button>
                {historial.length > 2 && (
                  <button 
                    type="button" 
                    onClick={handleGradeExercise} 
                    disabled={isSending || isGrading}
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-6 border border-emerald-300 rounded-xl transition-colors shadow-sm whitespace-nowrap"
                  >
                    {isGrading ? "Evaluando..." : "✅ Evaluar"}
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className={`p-6 rounded-2xl text-center shadow-md mb-4 ${gradeResult.score >= 80 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <h2 className={`text-2xl font-black mb-2 ${gradeResult.score >= 80 ? 'text-green-800' : 'text-amber-800'}`}>
                  Calificación Final: {gradeResult.score}/100
                </h2>
                <p className="italic text-lg text-gray-700">"{gradeResult.feedback}"</p>
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={handleReset} 
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-10 py-3 rounded-xl shadow-md transition-colors"
                >
                  Volver a configurar
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-rose-600 font-bold text-center mt-2 text-sm">{error}</p>}
        </div>
      </footer>
    </div>
  );
}