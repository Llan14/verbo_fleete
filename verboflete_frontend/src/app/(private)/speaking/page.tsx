"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ContextForm from "@/components/ContextForm";
import { GlassCard } from "@/components/GlassCard";

interface EjercicioSpeaking {
  verbo_infinitivo: string;
  persona_tecnica: string;
  sujeto: string;
  respuesta_esperada: string;
  mood: string;
  tense: string;
}

interface ResultadoEvaluacion {
  transcripcion: string;
  es_correcto: boolean;
  es_correcto_simple?: boolean;
  es_correcto_foneticamente?: boolean;
  respuesta_esperada: string;
  puntaje: number;
  mensaje: string;
}

export default function SpeakingPage() {
  const [config, setConfig] = useState<any>(null);
  const [ejercicio, setEjercicio] = useState<EjercicioSpeaking | null>(null);
  const [resultado, setResultado] = useState<ResultadoEvaluacion | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isPressingRef = useRef(false);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedState = sessionStorage.getItem("verboFlete_speaking_state");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setConfig(parsed.config);
        setEjercicio(parsed.ejercicio);
        setResultado(parsed.resultado);
      } catch (err) {
        console.error("Error leyendo la memoria de speaking:", err);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      if (ejercicio) {
        const stateToSave = { config, ejercicio, resultado };
        sessionStorage.setItem("verboFlete_speaking_state", JSON.stringify(stateToSave));
      } else {
        sessionStorage.removeItem("verboFlete_speaking_state");
      }
    }
  }, [config, ejercicio, resultado, isLoaded]);

  const handleStartPractice = async (formData: any) => {
    setLoading(true);
    setError("");

    setEjercicio(null); 
    setResultado(null);

    try {
      const token = getClientToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/speaking/generar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al generar el ejercicio");

      const data = await res.json();
      setConfig(formData);
      setEjercicio(data);
      setResultado(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    isPressingRef.current = true; 
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!isPressingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return; 
      }

      setIsRecording(true);

      const options = MediaRecorder.isTypeSupported("audio/webm")
        ? { mimeType: "audio/webm" }
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          alert("La grabación fue muy corta. Mantén presionado el botón para hablar.");
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        enviarAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      alert("No pudimos acceder a tu micrófono. Revisa los permisos de tu navegador.");
      isPressingRef.current = false;
    }
  };

  const stopRecording = () => {
    isPressingRef.current = false;
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const enviarAudio = async (audioBlob: Blob) => {
    if (!ejercicio) return;

    setIsProcessingAudio(true);
    setError("");

    const formData = new FormData();
    formData.append("audio", audioBlob, "grabacion.webm");
    formData.append("verbo_infinitivo", ejercicio.verbo_infinitivo);
    formData.append("sujeto", ejercicio.sujeto);
    formData.append("respuesta_esperada", ejercicio.respuesta_esperada);
    formData.append("tense", ejercicio.tense);

    try {
      const token = getClientToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/speaking/validar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Error al validar el audio");

      const data = await res.json();
      setResultado(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  if (!ejercicio) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans animate-in fade-in duration-500">
        <GlassCard className="p-6 md:p-10">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              🗣️ Práctica de Pronunciación
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">
              Configura tu sesión. Escucharemos tu conjugación usando Inteligencia Artificial.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-700 dark:text-slate-300 font-bold">Generando ejercicio...</p>
            </div>
          ) : (
            <ContextForm onGenerate={handleStartPractice} />
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-sans animate-in fade-in duration-500 flex flex-col items-center min-h-[80vh] justify-center space-y-6">
      <div className="w-full flex justify-between items-center">
        <button
          onClick={() => {
            sessionStorage.removeItem("verboFleteContext");
            sessionStorage.removeItem("verboFlete_speaking_state");
            setEjercicio(null);
            setConfig(null);
            setResultado(null);
          }}
          className="text-rose-600 dark:text-rose-400 hover:text-rose-500 dark:hover:text-rose-300 font-bold text-sm transition-colors cursor-pointer"
        >
          ✕ Terminar Sesión
        </button>
        <div className="flex gap-2">
          <span className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 tracking-widest">
            {ejercicio.mood}
          </span>
          <span className="bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 text-sky-700 dark:text-sky-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-widest">
            {ejercicio.tense}
          </span>
        </div>
      </div>

      {error && (
        <div className="w-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-800 dark:text-rose-200 p-4 rounded-2xl text-center text-sm font-bold backdrop-blur-md">
          {error}
        </div>
      )}

      <GlassCard className="w-full p-8 md:p-14 text-center relative">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
          Conjuga en voz alta
        </p>

        <div className="flex justify-center items-center gap-4 md:gap-8 mb-12">
          <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-950/40 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
            {ejercicio.sujeto}
          </div>
          <span className="text-2xl md:text-4xl text-slate-400 dark:text-slate-500">+</span>
          <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white capitalize bg-slate-100 dark:bg-slate-950/40 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner">
            {ejercicio.verbo_infinitivo}
          </div>
        </div>

        {!resultado ? (
          <div className="flex flex-col items-center justify-center space-y-6 min-h-40">
            {isProcessingAudio ? (
              <div className="flex flex-col items-center animate-pulse">
                <span className="text-4xl mb-4">🧠</span>
                <p className="text-sky-600 dark:text-sky-300 font-bold">
                  Whisper está analizando tu acento...
                </p>
              </div>
            ) : (
              <>
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  onTouchCancel={stopRecording}
                  className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl transition-all select-none cursor-pointer ${
                    isRecording
                      ? "bg-rose-500 text-white animate-pulse scale-110 shadow-2xl shadow-rose-500/50"
                      : "bg-sky-500 text-white hover:bg-sky-400 hover:scale-105 shadow-xl shadow-sky-950/20"
                  }`}
                >
                  🎙️
                </button>
                <p className={`font-bold transition-colors text-sm ${isRecording ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-300"}`}>
                  {isRecording ? "Escuchando... (Suelta para enviar)" : "Mantén presionado para hablar"}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className={`p-6 rounded-2xl border backdrop-blur-md ${resultado.es_correcto ? "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-200" : "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-800 dark:text-amber-200"}`}>
              <div className="text-4xl mb-2">
                {resultado.es_correcto ? "🏆" : "🧐"}
              </div>
              <h3 className="text-xl font-black mb-1">
                {resultado.es_correcto ? "¡Perfecto!" : "Casi lo logras"}
                {resultado.es_correcto_simple && !resultado.es_correcto_foneticamente && (
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300 block"> (La palabra es correcta, pero revisa la pronunciación)</span>
                )}
              </h3>
              <p className="text-sm opacity-90 mb-4">{resultado.mensaje}</p>

              <div className="bg-slate-100 dark:bg-slate-950/40 rounded-xl p-4 text-left border border-slate-200 dark:border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Lo que escuchamos:
                </p>
                <p className="font-medium italic mb-3 text-slate-900 dark:text-white">
                  "{resultado.transcripcion}"
                </p>

                {!resultado.es_correcto && (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Debías decir algo con:
                    </p>
                    <p className="font-bold underline decoration-2 underline-offset-4 text-sky-600 dark:text-sky-300">
                      {resultado.respuesta_esperada}
                    </p>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => handleStartPractice(config)}
              className="mt-8 w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-sky-950/20 flex justify-center items-center gap-2 cursor-pointer"
            >
              Siguiente Verbo <span>→</span>
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}