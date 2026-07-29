"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";

interface Opcion {
  id: string;
  texto: string;
}

interface EjercicioAudio {
  id: string;
  urlAudio: string; 
  pregunta: string;
  opciones: Opcion[];
  idOpcionCorrecta: string;
  explicacion: string;
}

export default function ListeningPage() {
  const router = useRouter();
  
  const [ejercicio, setEjercicio] = useState<EjercicioAudio | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);
  const [calificado, setCalificado] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [esCorrecto, setEsCorrecto] = useState<boolean>(false);
  
  const [isConfiguring, setIsConfiguring] = useState<boolean>(true);

  const [config, setConfig] = useState({
    nivel: "B1",
    contexto: "",
    grupo_verbos: "Mezclados",
    mood: "indicatif",
    tense: "présent"
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [reproduciendo, setReproduciendo] = useState<boolean>(false);
  const [velocidadAudio, setVelocidadAudio] = useState<number>(1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = velocidadAudio;
    }
  }, [velocidadAudio, ejercicio]);

  const cargarNuevoEjercicio = async () => {
    setCargando(true);
    setError("");
    setOpcionSeleccionada(null);
    setCalificado(false);
    setFeedback("");
    setReproduciendo(false);

    try {
      const token = getClientToken();
      const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listening/generate-opciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo generar el ejercicio de audio con opciones.");
      }

      const datos: EjercicioAudio = await respuesta.json();
      setEjercicio(datos);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const alternarAudio = () => {
    if (!audioRef.current) return;
    if (reproduciendo) {
      audioRef.current.pause();
      setReproduciendo(false);
    } else {
      audioRef.current.play();
      setReproduciendo(true);
    }
  };

  const enviarCalificacion = async () => {
    if (!opcionSeleccionada || !ejercicio) return;

    try {
      const token = getClientToken();
      const respuesta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listening/grade-opciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id_opcion_usuario: opcionSeleccionada,
          id_opcion_correcta: ejercicio.idOpcionCorrecta,
          explicacion: ejercicio.explicacion,
          pregunta: ejercicio.pregunta,
          config: config
        })
      });

      if (!respuesta.ok) throw new Error("Error en la respuesta del calificador.");

      const resultado = await respuesta.json();
      
      setEsCorrecto(opcionSeleccionada === ejercicio.idOpcionCorrecta);
      setFeedback(resultado.feedback);
      setCalificado(true);
    } catch (err: any) {
      setError("No se pudo procesar la calificación.");
    }
  };

  if (isConfiguring) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 font-sans animate-in fade-in duration-500">
        <GlassCard className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">🎧 Práctica de Comprensión Auditiva</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">Configura tu sesión. Entrena tu oído con audios generados por Inteligencia Artificial.</p>
          </div>
          <ConfiguradorEjercicio 
            config={config} 
            setConfig={setConfig} 
            onStart={() => {
              setIsConfiguring(false);
              cargarNuevoEjercicio();
            }} 
          />
        </GlassCard>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Generando pregunta de opción múltiple...</p>
      </div>
    );
  }

  if (error || !ejercicio) {
    return (
      <div className="p-8 text-center max-w-md mx-auto font-sans">
        <GlassCard className="border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-6 mb-4">
          <p className="text-rose-800 dark:text-rose-200 text-sm">{error || "Error al cargar el ejercicio."}</p>
        </GlassCard>
        <button onClick={cargarNuevoEjercicio} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm cursor-pointer shadow-lg">
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-black text-sky-700 dark:text-sky-300 bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 px-3 py-1 rounded-full uppercase tracking-wider">
            Comprensión Auditiva ({config.nivel})
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-2">Escucha y Selecciona</h1>
        </div>
        <button 
          onClick={() => {
            setIsConfiguring(true);
            setConfig((prev) => ({ ...prev, contexto: "" })); 
          }} 
          className="px-3.5 py-1.5 text-xs font-bold bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 rounded-xl border border-rose-500/20 dark:border-rose-500/30 transition-all cursor-pointer"
        >
          ✕ Salir
        </button>
      </div>

      <GlassCard className="p-6 flex flex-col items-center space-y-4">
        <audio 
          ref={audioRef} 
          src={`data:audio/mp3;base64,${ejercicio.urlAudio}`} 
          onEnded={() => setReproduciendo(false)}
        />
        <button
          onClick={alternarAudio}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-lg cursor-pointer active:scale-95 ${
            reproduciendo ? "bg-amber-500 text-white animate-pulse shadow-amber-500/40" : "bg-sky-500 text-white hover:bg-sky-400 shadow-sky-500/40"
          }`}
        >
          {reproduciendo ? "⏸" : "▶"}
        </button>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
          {reproduciendo ? "Escuchando..." : "Reproducir audio"}
        </span>

        <div className="flex items-center gap-2 pt-2">
          {[0.75, 1, 1.25, 1.5].map((speed) => (
            <button
              key={speed}
              onClick={() => setVelocidadAudio(speed)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                velocidadAudio === speed
                  ? "bg-sky-500 text-white border-sky-400"
                  : "bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-start gap-2">
          <span className="text-sky-500 dark:text-sky-400">❓</span> {ejercicio.pregunta}
        </h3>

        <div className="space-y-2.5">
          {ejercicio.opciones.map((opcion) => {
            const esSeleccionada = opcionSeleccionada === opcion.id;
            let clasesBoton = "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 hover:border-sky-500/40 dark:hover:border-sky-400/40 text-slate-800 dark:text-slate-200";

            if (esSeleccionada) {
              clasesBoton = "border-sky-500 dark:border-sky-400 bg-sky-500/10 dark:bg-sky-500/30 text-slate-900 dark:text-white ring-2 ring-sky-400/40";
            }
            if (calificado) {
              if (opcion.id === ejercicio.idOpcionCorrecta) {
                clasesBoton = "border-emerald-500 dark:border-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold";
              } else if (esSeleccionada && !esCorrecto) {
                clasesBoton = "border-rose-500 dark:border-rose-400 bg-rose-500/10 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 font-bold";
              } else {
                clasesBoton = "opacity-40 border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 pointer-events-none";
              }
            }

            return (
              <button
                key={opcion.id}
                disabled={calificado}
                onClick={() => setOpcionSeleccionada(opcion.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border font-medium text-sm transition-all flex items-center gap-3 cursor-pointer ${clasesBoton}`}
              >
                <span className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shrink-0 ${
                  esSeleccionada ? "bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-950" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                }`}>
                  {opcion.id}
                </span>
                {opcion.texto}
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          {!calificado ? (
            <button
              disabled={!opcionSeleccionada}
              onClick={enviarCalificacion}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
                opcionSeleccionada 
                  ? "bg-sky-500 text-white hover:bg-sky-400 cursor-pointer shadow-lg shadow-sky-950/20" 
                  : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 pointer-events-none"
              }`}
            >
              Comprobar Respuesta
            </button>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              <div className={`p-4 rounded-xl border text-sm backdrop-blur-md ${
                esCorrecto ? "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-200" : "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 text-rose-800 dark:text-rose-200"
              }`}>
                <p className="font-bold text-sm">
                  {esCorrecto ? "🎉 ¡Correcto!" : "❌ Respuesta incorrecta"}
                </p>
                <p className="text-xs mt-1.5 leading-relaxed font-normal">{feedback}</p>
              </div>

              <button
                onClick={cargarNuevoEjercicio}
                className="w-full py-3.5 bg-sky-500 text-white font-bold text-sm rounded-xl hover:bg-sky-400 transition-all shadow-lg shadow-sky-950/20 cursor-pointer"
              >
                🔄 Siguiente Ejercicio
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

interface Configuracion {
  nivel: string;
  contexto: string;
  grupo_verbos: string;
  mood: string;
  tense: string;
}

interface ConfiguradorProps {
  config: Configuracion;
  setConfig: React.Dispatch<React.SetStateAction<Configuracion>>;
  onStart: () => void;
}

function ConfiguradorEjercicio({ config, setConfig, onStart }: ConfiguradorProps) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-lg font-bold text-slate-900 dark:text-white">¿Qué quieres practicar hoy?</label>
      
      <input 
        placeholder="Ej: Viajes, Entrevista de trabajo, Un día en París..." 
        className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-base w-full outline-none focus:border-sky-500 dark:focus:border-sky-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
        value={config.contexto}
        onChange={(e) => setConfig({ ...config, contexto: e.target.value })}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select 
          className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-slate-900 dark:text-white cursor-pointer text-sm shadow-sm"
          value={config.nivel}
          onChange={(e) => setConfig({ ...config, nivel: e.target.value })}
        >
          <option value="A1">Nivel A1</option>
          <option value="A2">Nivel A2</option>
          <option value="B1">Nivel B1</option>
          <option value="B2">Nivel B2</option>
          <option value="C1">Nivel C1</option>
        </select>
        
        <select 
          className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-slate-900 dark:text-white cursor-pointer text-sm shadow-sm"
          value={config.grupo_verbos}
          onChange={(e) => setConfig({ ...config, grupo_verbos: e.target.value })}
        >
          <option value="1er (Terminados en -er)">1er Grupo (-er)</option>
          <option value="2do (Terminados en -ir)">2do Grupo (-ir)</option>
          <option value="3er (Irregulares)">3er Grupo (Irregulares)</option>
          <option value="Auxiliares (être/avoir)">Auxiliares (Être/Avoir)</option>
          <option value="Mezclados">Todos los grupos</option>
        </select>
        
        <select 
          className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-slate-900 dark:text-white cursor-pointer text-sm font-medium shadow-sm"
          value={config.mood}
          onChange={(e) => setConfig({ ...config, mood: e.target.value })}
        >
          <option value="indicatif">Indicatif</option>
          <option value="subjonctif">Subjonctif</option>
          <option value="conditionnel">Conditionnel</option>
          <option value="impératif">Impératif</option>
        </select>
        
        <select 
          className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-slate-900 dark:text-white cursor-pointer text-sm font-medium shadow-sm"
          value={config.tense}
          onChange={(e) => setConfig({ ...config, tense: e.target.value })}
        >
          <option value="présent">Présent</option>
          <option value="passé composé">Passé composé</option>
          <option value="imparfait">Imparfait</option>
          <option value="plus que parfait">Plus-que-parfait</option>
          <option value="futur simple">Futur simple</option>
          <option value="passé simple">Passé simple</option>
        </select>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between mt-2 pt-4 border-t border-slate-200 dark:border-white/10 gap-4">
        <p className="text-xs text-slate-600 dark:text-slate-300">Define el tema, tu nivel, los verbos y el tiempo gramatical para la IA.</p>
        <button 
          onClick={onStart}
          disabled={!config.contexto || config.contexto.trim() === ""}
          className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-sky-950/20 cursor-pointer"
        >
          Generar Ejercicio
        </button>
      </div>
    </div>
  );
}