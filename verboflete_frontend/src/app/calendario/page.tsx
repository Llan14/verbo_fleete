"use client";

import { useState, useEffect, useMemo } from "react";
import TareaModal from "../../components/TareaModal"; // ⚠️ Asegúrate que la ruta sea correcta

// --- Tipos de Datos ---
export interface Tarea { // Exportamos el tipo para poder usarlo en TareaModal
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_entrega: string; // La API devuelve un string ISO 8601
  grupo_id: number;
}

type TareasPorDia = Map<string, Tarea[]>;

export default function CalendarioPage() {
  // --- Estados ---
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  // --- Petición de Datos ---
  useEffect(() => {
    const fetchTareas = async () => {
      setCargando(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No estás autenticado. Por favor, inicia sesión.");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calendario/tareas`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las tareas del calendario.");
        }

        const data: Tarea[] = await response.json();
        setTareas(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchTareas();
  }, []);

  // --- Lógica Matemática del Mes ---
  const mes = fechaActual.getMonth();
  const anio = fechaActual.getFullYear();

  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const primerDiaDelMes = new Date(anio, mes, 1).getDay(); // 0: Domingo, 1: Lunes...
  
  // Ajuste para que la semana empiece en Lunes (0) y termine en Domingo (6)
  const diaInicialAjustado = (primerDiaDelMes === 0) ? 6 : primerDiaDelMes - 1;

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const cambiarMes = (incremento: number) => {
    setFechaActual(prevFecha => {
      const nuevaFecha = new Date(prevFecha);
      nuevaFecha.setMonth(nuevaFecha.getMonth() + incremento);
      return nuevaFecha;
    });
  };

  // --- Agrupación de Tareas (Optimización) ---
  const tareasAgrupadas = useMemo<TareasPorDia>(() => {
    const mapaTareas: TareasPorDia = new Map();
    tareas.forEach(tarea => {
      const fechaTarea = new Date(`${tarea.fecha_entrega}T00:00:00`);
      const claveFecha = `${fechaTarea.getFullYear()}-${fechaTarea.getMonth()}-${fechaTarea.getDate()}`;
      
      if (!mapaTareas.has(claveFecha)) {
        mapaTareas.set(claveFecha, []);
      }
      mapaTareas.get(claveFecha)?.push(tarea);
    });
    return mapaTareas;
  }, [tareas]);

  // --- Renderizado ---
  if (cargando) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-text-muted">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Cargando tu calendario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-primary tracking-tight capitalize">
          {fechaActual.toLocaleString("es-ES", { month: "long", year: "numeric" })}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiarMes(-1)}
            className="px-4 py-2 bg-surface border border-border rounded-lg font-bold text-primary hover:bg-background transition-colors"
          >
            ‹ Anterior
          </button>
          <button
            onClick={() => cambiarMes(1)}
            className="px-4 py-2 bg-surface border border-border rounded-lg font-bold text-primary hover:bg-background transition-colors"
          >
            Siguiente ›
          </button>
        </div>
      </div>

      {/* Contenedor del Calendario */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-border">
          {diasSemana.map(dia => (
            <div key={dia} className="p-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
              {dia}
            </div>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="grid grid-cols-7">
          {/* Celdas vacías al inicio */}
          {Array.from({ length: diaInicialAjustado }).map((_, index) => (
            <div key={`empty-${index}`} className="border-r border-b border-border bg-background/50"></div>
          ))}

          {/* Días del mes */}
          {Array.from({ length: diasEnMes }).map((_, index) => {
            const dia = index + 1;
            const fechaCelda = new Date(anio, mes, dia);
            const hoy = new Date();
            const esHoy = hoy.getDate() === dia && hoy.getMonth() === mes && hoy.getFullYear() === anio;

            const claveFecha = `${anio}-${mes}-${dia}`;
            const tareasDelDia = tareasAgrupadas.get(claveFecha) || [];
            return (
              <div
                key={dia}
                className="relative min-h-[120px] border-r border-b border-border p-2 flex flex-col group hover:bg-teal-50/20 transition-colors"
              >
                {/* Número del día */}
                <span className={`font-bold text-sm ${
                  esHoy 
                    ? "bg-teal-500 text-white rounded-full w-7 h-7 flex items-center justify-center" 
                    : "text-text-muted"
                }`}>
                  {dia}
                </span>

                {/* Contenedor de Tareas */}
                <div className="mt-2 space-y-1 overflow-y-auto flex-1">
                  {tareasDelDia.map(tarea => (
                    <div 
                      key={tarea.id} 
                      title={tarea.titulo}
                      onClick={() => setTareaSeleccionada(tarea)}
                      className="bg-blue-100 text-blue-800 text-xs font-semibold rounded-md px-2 py-1 truncate cursor-pointer hover:ring-2 hover:ring-blue-300"
                    >
                      {tarea.titulo}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Celdas vacías al final para completar la cuadrícula */}
          {Array.from({ length: (7 - (diaInicialAjustado + diasEnMes) % 7) % 7 }).map((_, index) => (
            <div key={`empty-end-${index}`} className="border-r border-b border-border bg-background/50"></div>
          ))}
        </div>
      </div>

      {tareas.length === 0 && !cargando && (
        <div className="text-center mt-8 p-4 bg-surface border border-border rounded-2xl">
            <h3 className="font-bold text-primary">¡Todo despejado!</h3>
            <p className="text-text-muted text-sm">No tienes tareas programadas en tu calendario por ahora.</p>
        </div>
      )}

      <footer className="text-center mt-8 text-sm text-text-muted">
        <p>Calendario de tareas integrado. Las fechas de entrega se muestran según tu zona horaria.</p>
      </footer>

      {/* Renderizamos el modal si hay una tarea seleccionada */}
      {tareaSeleccionada && (
        <TareaModal tarea={tareaSeleccionada} onClose={() => setTareaSeleccionada(null)} />
      )}
    </div>
  );
}