"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  
  // Estados de control
  const [ejercicio, setEjercicio] = useState<EjercicioAudio | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);
  const [calificado, setCalificado] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");
  const [esCorrecto, setEsCorrecto] = useState<boolean>(false);
  
  // Configuración inicial (puedes adaptarla según los estados globales de tu app)
  const [config] = useState({
    nivel: "B1",
    contexto: "general",
    grupo_verbos: "comunes",
    mood: "indicative",
    tense: "present"
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [reproduciendo, setReproduciendo] = useState<boolean>(false);

  // Llama al nuevo endpoint del backend que creamos para las opciones múltiples
  const cargarNuevoEjercicio = async () => {
    setCargando(true);
    setError("");
    setOpcionSeleccionada(null);
    setCalificado(false);
    setFeedback("");
    setReproduciendo(false);

    try {
      const token = localStorage.getItem("token");
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

  useEffect(() => {
    cargarNuevoEjercicio();
  }, []);

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

  // Envía la opción elegida al nuevo calificador del backend
  const enviarCalificacion = async () => {
    if (!opcionSeleccionada || !ejercicio) return;

    try {
      const token = localStorage.getItem("token");
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

  const terminarSesion = () => {
    router.push("/dashboard"); 
  };

  if (cargando) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-text-muted">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Generando pregunta de opción múltiple...</p>
      </div>
    );
  }

  if (error || !ejercicio) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 mb-4">
          {error || "Error al cargar el ejercicio."}
        </div>
        <button onClick={cargarNuevoEjercicio} className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm">
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      
      {/* Encabezado */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Comprensión Auditiva ({config.nivel})
          </span>
          <h1 className="text-2xl font-black text-primary mt-1">Escucha y Selecciona</h1>
        </div>
        <button 
          onClick={terminarSesion}
          className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-100 transition-all"
        >
          ✕ Salir
        </button>
      </div>

      {/* Reproductor de Audio */}
      <div className="bg-surface p-6 rounded-3xl border border-border shadow-xs flex flex-col items-center space-y-3">
        <audio 
          ref={audioRef} 
          src={`data:audio/mp3;base64,${ejercicio.urlAudio}`} 
          onEnded={() => setReproduciendo(false)}
        />
        <button
          onClick={alternarAudio}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-xs active:scale-95 ${
            reproduciendo ? "bg-amber-500 text-white animate-pulse" : "bg-teal-500 text-white hover:bg-teal-600"
          }`}
        >
          {reproduciendo ? "⏸" : "▶"}
        </button>
        <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider">
          {reproduciendo ? "Escuchando..." : "Reproducir audio"}
        </span>
      </div>

      {/* Cuestionario */}
      <div className="bg-surface p-6 rounded-3xl border border-border shadow-xs space-y-4">
        <h3 className="text-base font-bold text-primary flex items-start gap-2">
          <span className="text-teal-500">❓</span> {ejercicio.pregunta}
        </h3>

        {/* Mapeo de Opciones */}
        <div className="space-y-2">
          {ejercicio.opciones.map((opcion) => {
            const esSeleccionada = opcionSeleccionada === opcion.id;
            let clasesBoton = "border-border bg-background hover:border-teal-400 text-primary";

            if (esSeleccionada) {
              clasesBoton = "border-teal-500 bg-teal-50/30 text-teal-950 ring-2 ring-teal-500/10";
            }
            if (calificado) {
              if (opcion.id === ejercicio.idOpcionCorrecta) {
                clasesBoton = "border-green-500 bg-green-50 text-green-900";
              } else if (esSeleccionada && !esCorrecto) {
                clasesBoton = "border-rose-500 bg-rose-50 text-rose-900";
              } else {
                clasesBoton = "opacity-40 border-border bg-background text-text-muted pointer-events-none";
              }
            }

            return (
              <button
                key={opcion.id}
                disabled={calificado}
                onClick={() => setOpcionSeleccionada(opcion.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center gap-3 ${clasesBoton}`}
              >
                <span className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shrink-0 ${
                  esSeleccionada ? "bg-teal-500 text-white" : "bg-neutral-100 text-neutral-500"
                }`}>
                  {opcion.id}
                </span>
                {opcion.texto}
              </button>
            );
          })}
        </div>

        {/* Sección de acciones e Historial Infinito */}
        <div className="pt-2">
          {!calificado ? (
            <button
              disabled={!opcionSeleccionada}
              onClick={enviarCalificacion}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
                opcionSeleccionada 
                  ? "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer shadow-xs" 
                  : "bg-neutral-100 text-neutral-400 pointer-events-none"
              }`}
            >
              Comprobar Respuesta
            </button>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              <div className={`p-4 rounded-xl border text-sm ${
                esCorrecto ? "bg-green-50 border-green-200 text-green-800" : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                <p className="font-bold text-sm">
                  {esCorrecto ? "🎉 ¡Correcto!" : "❌ Respuesta incorrecta"}
                </p>
                <p className="text-xs mt-1.5 leading-relaxed font-normal">{feedback}</p>
              </div>

              {/* El botón de generación infinita */}
              <button
                onClick={cargarNuevoEjercicio}
                className="w-full py-3.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-xs"
              >
                🔄 Siguiente Ejercicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}