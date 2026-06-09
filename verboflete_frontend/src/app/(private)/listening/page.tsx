"use client";

import { useState, useEffect, useRef } from "react";
import ContextForm from "@/components/ContextForm";
import Link from "next/link";

interface ListeningGenerateResponse {
  audio_base64: string;
  texto_original: string;
}

interface ListeningGradeResponse {
  score: number;
  feedback: string;
  texto_original: string;
  sesion_id?: number;
}

export default function ListeningPage() {
  // Estados principales
  const [config, setConfig] = useState<any>(null);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [textoOriginal, setTextoOriginal] = useState<string>("");
  const [respuestaUsuario, setRespuestaUsuario] = useState<string>("");
  const [gradeResult, setGradeResult] = useState<ListeningGradeResponse | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // Progreso en porcentaje
  
  // Estados de UI
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState("");

  // 1. CARGA INICIAL: Recuperar TODO el estado desde un solo objeto
  useEffect(() => {
    // Limpiamos la basura vieja si es que el usuario la tenía
    sessionStorage.removeItem("listConfig");
    sessionStorage.removeItem("listAudio");
    sessionStorage.removeItem("listTexto");
    sessionStorage.removeItem("listRespuesta");

    const savedState = sessionStorage.getItem("verboFlete_listening_state");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setConfig(parsed.config);
        setAudioSrc(parsed.audioSrc);
        setTextoOriginal(parsed.textoOriginal);
        setRespuestaUsuario(parsed.respuestaUsuario || "");
        setGradeResult(parsed.gradeResult); // ¡Ahora sí guardamos la calificación!
      } catch (err) {
        console.error("Error leyendo la memoria de listening:", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. AUTOGUARDADO: Actualizar la memoria unificada cada vez que el usuario haga algo
  useEffect(() => {
    if (isLoaded) {
      if (config) {
        const stateToSave = {
          config,
          audioSrc,
          textoOriginal,
          respuestaUsuario,
          gradeResult
        };
        sessionStorage.setItem("verboFlete_listening_state", JSON.stringify(stateToSave));
      } else {
        sessionStorage.removeItem("verboFlete_listening_state");
      }
    }
  }, [config, audioSrc, textoOriginal, respuestaUsuario, gradeResult, isLoaded]);

  const handleGenerate = async (formData: any) => {
    setIsGenerating(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listening/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Error al generar el dictado de audio.");
      const data: ListeningGenerateResponse = await res.json();
      
      setConfig(formData);
      setAudioSrc(`data:audio/mp3;base64,${data.audio_base64}`);
      setTextoOriginal(data.texto_original);
      setRespuestaUsuario("");
      setGradeResult(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGrade = async () => {
    if (!respuestaUsuario.trim()) return;
    
    setIsGrading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listening/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          config: config,
          texto_original: textoOriginal,
          respuesta_usuario: respuestaUsuario
        })
      });

      if (!res.ok) throw new Error("Error al calificar el ejercicio.");
      const data: ListeningGradeResponse = await res.json();
      setGradeResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGrading(false);
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem("verboFleteContext");
    sessionStorage.removeItem("verboFlete_listening_state");
    setConfig(null);
    setAudioSrc("");
    setTextoOriginal("");
    setRespuestaUsuario("");
    setGradeResult(null);
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
      setSpeed(newSpeed);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(newProgress || 0);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = (audioRef.current.duration / 100) * parseInt(e.target.value);
    }
  };

  if (!isLoaded) return <div className="w-full h-dvh bg-background"></div>;

  if (!config) {
    return (
      <div className="flex items-center justify-center bg-background p-6">
        <div className="max-w-3xl w-full">
          <h1 className="text-4xl font-black text-primary mb-2">🎧 Comprensión Oral</h1>
          <p className="text-text-muted mb-8">Escucha el audio generado por la IA y escribe exactamente lo que dice (Dictado).</p>
          
          {error && <p className="text-rose-600 font-bold text-center mb-4">{error}</p>}
          
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-text-muted font-bold animate-pulse">Generando audio y transcripción...</p>
            </div>
          ) : (
            <ContextForm onGenerate={handleGenerate} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-dvh flex flex-col bg-background">
      
      <header className="bg-surface border-b border-border p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
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

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="max-w-3xl w-full space-y-8">
          
          <div className="bg-white border border-border rounded-3xl p-8 shadow-sm text-center flex flex-col items-center">
            <h2 className="text-xl font-black text-primary mb-6">Écoute attentivement 👂</h2>
            {audioSrc ? (
          <div className="flex flex-col items-center w-full max-w-md space-y-4">
            <audio
              ref={audioRef}
              className="w-full custom-audio-player mb-5"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
            >
              <source src={audioSrc} type="audio/mp3" />
              Tu navegador no soporta el elemento de audio.
            </audio>

            {/* Controles personalizados */}
            <div className="flex items-center gap-4 w-full">
              <button
                onClick={togglePlayPause}
                className="px-4 py-2 text-sm font-bold transition-colors bg-primary hover:bg-blue-700 text-white rounded-xl shadow-md"
              >
                {isPlaying ? "⏸️ Pausar" : "▶️ Reproducir"}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleProgressChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
            
            {/* Controles de velocidad */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-text-muted">Velocidad:</span>
              <div className="flex bg-background border border-border rounded-xl overflow-hidden shadow-sm">
                {[0.5, 0.75, 1, 1.25].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleSpeedChange(rate)}
                    className={`px-4 py-1.5 text-sm font-bold transition-colors ${
                      speed === rate 
                        ? "bg-menu-active text-white" 
                        : "hover:bg-gray-100 text-text-muted"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
            ) : (
              <p className="text-text-muted">Cargando audio...</p>
            )}
            <p className="text-sm text-text-muted mt-4 italic">
              Reproduce el audio las veces que necesites y escribe lo que escuches.
            </p>
          </div>

          {!gradeResult ? (
            <div className="space-y-4">
              <textarea
                value={respuestaUsuario}
                onChange={(e) => setRespuestaUsuario(e.target.value)}
                placeholder="Tape ici ce que tu entends..."
                className="w-full h-48 p-6 rounded-3xl border-2 border-border bg-surface focus:outline-none focus:border-primary resize-none text-lg leading-relaxed transition-colors shadow-inner"
                disabled={isGrading}
              />
              
              <div className="flex justify-end">
                <button
                  onClick={handleGrade}
                  disabled={!respuestaUsuario.trim() || isGrading}
                  className="bg-primary hover:bg-blue-700 disabled:bg-gray-300 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-md"
                >
                  {isGrading ? "Evaluando..." : "Evaluar Dictado"}
                </button>
              </div>
              {error && <p className="text-rose-600 font-bold text-right">{error}</p>}
            </div>
          ) : (
            
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className={`border p-8 rounded-3xl text-center shadow-sm ${gradeResult.score >= 80 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="text-6xl mb-4">{gradeResult.score >= 80 ? "🏆" : "💪"}</div>
                <h3 className={`text-3xl font-black mb-2 ${gradeResult.score >= 80 ? 'text-green-800' : 'text-amber-800'}`}>
                  Puntuación: {gradeResult.score}%
                </h3>
                <p className="text-lg italic opacity-80 mb-6">"{gradeResult.feedback}"</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border border-border p-6 rounded-2xl">
                  <h4 className="text-xs font-black uppercase text-text-muted mb-2 tracking-widest">Lo que tú escribiste:</h4>
                  <p className="text-rose-900 font-medium">{respuestaUsuario}</p>
                </div>
                <div className="bg-white border border-green-200 p-6 rounded-2xl">
                  <h4 className="text-xs font-black uppercase text-green-700 mb-2 tracking-widest">El texto original era:</h4>
                  <p className="text-green-900 font-medium">{gradeResult.texto_original}</p>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button onClick={handleReset} className="bg-menu-active hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors">
                  Generar otro dictado
              <div className="flex justify-center gap-4 pt-4">
                <button onClick={handleReset} className="bg-background border border-border hover:bg-gray-100 text-text-muted font-bold py-3 px-6 rounded-xl shadow-sm transition-colors">
                  Otro dictado
                </button>
                {gradeResult.sesion_id && (
                  <Link href={`/sessions/ejercicio?id=${gradeResult.sesion_id}`}>
                    <button className="bg-menu-active hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors">
                      Ver Reporte en Dashboard
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}          
        </div>
      </main>
    </div>
  );
}