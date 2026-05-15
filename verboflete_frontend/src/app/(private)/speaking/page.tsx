"use client";

import { useState, useRef, useEffect } from "react";
import ContextForm from "@/components/ContextForm";

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
  respuesta_esperada: string;
  puntaje: number;
  mensaje: string;
}

export default function SpeakingPage() {
  // Estados principales
  const [config, setConfig] = useState<any>(null);
  const [ejercicio, setEjercicio] = useState<EjercicioSpeaking | null>(null);
  const [resultado, setResultado] = useState<ResultadoEvaluacion | null>(null);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isPressingRef = useRef(false);

  // Bandera de carga de memoria
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. CARGA INICIAL: Recuperar datos al montar el componente
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

  // 2. AUTOGUARDADO: Guardar cuando algo importante cambie
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
      const token = localStorage.getItem("token");
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
      setIsRecording(true);
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
      const token = localStorage.getItem("token");
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
      <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary mt-4 tracking-tight">
            🗣️ Práctica de Pronunciación
          </h1>
          <p className="text-text-muted mt-2">
            Configura tu sesión. Escucharemos tu conjugación usando Inteligencia
            Artificial.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-text-muted font-bold">Generando ejercicio...</p>
          </div>
        ) : (
          <ContextForm onGenerate={handleStartPractice} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center min-h-[80vh] justify-center">
      <div className="w-full flex justify-between items-center mb-8">
        <button
          onClick={() => {
            // Limpiamos la sesión general y la local
            sessionStorage.removeItem("verboFleteContext");
            sessionStorage.removeItem("verboFlete_speaking_state");
            setEjercicio(null);
            setConfig(null);
            setResultado(null);
          }}
          className="text-text-muted hover:text-rose-500 font-bold text-sm transition-colors"
        >
          ✕ Terminar Sesión
        </button>{" "}
        <div className="flex gap-2">
          <span className="bg-background border border-border text-[10px] font-black uppercase px-3 py-1 rounded-full text-text-muted tracking-widest">
            {ejercicio.mood}
          </span>
          <span className="bg-menu-active text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
            {ejercicio.tense}
          </span>
        </div>
      </div>

      {error && (
        <div className="w-full bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200 mb-6 text-center text-sm font-bold">
          {error}
        </div>
      )}

      <div className="w-full bg-surface border border-border shadow-md rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
        <p className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
          Conjuga en voz alta
        </p>

        <div className="flex justify-center items-center gap-4 md:gap-8 mb-12">
          <div className="text-3xl md:text-5xl font-black text-primary bg-background px-6 py-4 rounded-2xl border border-border/50">
            {ejercicio.sujeto}
          </div>
          <span className="text-2xl md:text-4xl text-text-muted/50">+</span>
          <div className="text-3xl md:text-5xl font-black text-primary capitalize bg-background px-6 py-4 rounded-2xl border border-border/50">
            {ejercicio.verbo_infinitivo}
          </div>
        </div>

        {!resultado ? (
          <div className="flex flex-col items-center justify-center space-y-6 min-h-40">
            {isProcessingAudio ? (
              <div className="flex flex-col items-center animate-pulse">
                <span className="text-4xl mb-4">🧠</span>
                <p className="text-menu-active font-bold">
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
  className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl transition-all shadow-xl select-none ${
    isRecording
      ? "bg-rose-500 text-white animate-pulse scale-110 shadow-rose-500/50"
      : "bg-primary text-white hover:bg-primary-hover hover:scale-105"
  }`}
                >
                  🎙️
                </button>
                <p
                  className={`font-bold transition-colors ${isRecording ? "text-rose-500" : "text-text-muted"}`}
                >
                  {isRecording
                    ? "Escuchando... (Suelta para enviar)"
                    : "Mantén presionado para hablar"}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div
              className={`p-6 rounded-2xl border-2 ${
                resultado.es_correcto
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <div className="text-4xl mb-2">
                {resultado.es_correcto ? "🏆" : "🧐"}
              </div>
              <h3 className="text-xl font-black mb-1">
                {resultado.es_correcto ? "¡Perfecto!" : "Casi lo logras"}
              </h3>
              <p className="text-sm opacity-80 mb-4">{resultado.mensaje}</p>

              <div className="bg-white/60 rounded-xl p-4 text-left border border-black/5">
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-1">
                  Lo que escuchamos:
                </p>
                <p className="font-medium italic mb-3">
                  "{resultado.transcripcion}"
                </p>

                {!resultado.es_correcto && (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-1">
                      Debías decir algo con:
                    </p>
                    <p className="font-bold underline decoration-2 underline-offset-4">
                      {resultado.respuesta_esperada}
                    </p>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => handleStartPractice(config)}
              className="mt-8 w-full bg-menu-active hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
            >
              Siguiente Verbo <span>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}