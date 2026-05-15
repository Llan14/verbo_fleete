"use client";

import { useState, useEffect } from "react";

export interface ContextData {
  contexto: string;
  nivel: string;
  grupo_verbos: string;
  mood: string;
  tense: string;
}

interface ContextFormProps {
  onGenerate: (datos: ContextData) => void;
  isLoading?: boolean;
}

export default function ContextForm({ onGenerate, isLoading }: ContextFormProps) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("A1");
  const [verbGroup, setVerbGroup] = useState("1er (Terminados en -er)");
  const [mood, setMood] = useState("Indicatif");
  const [tense, setTense] = useState("Présent");
  
  const [isContextSet, setIsContextSet] = useState(false);

  useEffect(() => {
    const savedContext = sessionStorage.getItem("verboFleteContext");
    if (savedContext) {
      const parsed = JSON.parse(savedContext);
      setTopic(parsed.topic);
      setLevel(parsed.level);
      setVerbGroup(parsed.verbGroup);
      setMood(parsed.mood);
      setTense(parsed.tense);
      setIsContextSet(true);
    }
  }, []);

  const handleGenerate = () => {
    const backendPayload: ContextData = {
      contexto: topic,
      nivel: level,
      grupo_verbos: verbGroup,
      mood: mood,
      tense: tense,
    };

    sessionStorage.setItem("verboFleteContext", JSON.stringify({ 
      topic, 
      level, 
      verbGroup, 
      mood,
      tense,
      backendPayload 
    }));
    
    setIsContextSet(true);
    onGenerate(backendPayload);
  };

  const handleChange = () => {
    setIsContextSet(false);
    sessionStorage.removeItem("verboFleteContext");
  };

  const savedContextDisplay = `${topic} • ${level} • ${verbGroup} • ${mood} (${tense})`;

  return (
    <div className="mt-4 mb-6">
      {!isContextSet ? (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-white p-5 rounded-xl border border-border shadow-sm">
          <label className="text-lg font-bold text-primary">
            ¿Qué quieres practicar hoy?
          </label>
          
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej: Viajes, Entrevista de trabajo, Un día en París..."
            className="border-2 border-border rounded-lg px-4 py-3 text-lg w-full outline-none focus:border-menu-active transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={isLoading}
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="border-2 border-border rounded-lg px-4 py-2 outline-none focus:border-menu-active bg-white cursor-pointer"
              disabled={isLoading}
            >
              <option value="A1">Nivel A1</option>
              <option value="A2">Nivel A2</option>
              <option value="B1">Nivel B1</option>
              <option value="B2">Nivel B2</option>
              <option value="C1">Nivel C1</option>
            </select>

            <select
              value={verbGroup}
              onChange={(e) => setVerbGroup(e.target.value)}
              className="border-2 border-border rounded-lg px-4 py-2 outline-none focus:border-menu-active bg-white cursor-pointer"
              disabled={isLoading}
            >
              <option value="1er (Terminados en -er)">1er Grupo (-er)</option>
              <option value="2do (Terminados en -ir)">2do Grupo (-ir)</option>
              <option value="3er (Irregulares)">3er Grupo (Irregulares)</option>
              <option value="Auxiliares (être/avoir)">Auxiliares (Être/Avoir)</option>
              <option value="Mezclados">Todos los grupos</option>
            </select>

            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="border-2 border-border rounded-lg px-4 py-2 outline-none focus:border-menu-active bg-white cursor-pointer font-medium text-primary"
              disabled={isLoading}
            >
              <option value="indicatif">Indicatif</option>
              <option value="subjonctif">Subjonctif</option>
              <option value="conditionnel">Conditionnel</option>
              <option value="impératif">Impératif</option>
            </select>

            <select
              value={tense}
              onChange={(e) => setTense(e.target.value)}
              className="border-2 border-border rounded-lg px-4 py-2 outline-none focus:border-menu-active bg-white cursor-pointer font-medium text-primary"
              disabled={isLoading}
            >
              <option value="présent">Présent</option>
              <option value="passé composé">Passé composé</option>
              <option value="imparfait">Imparfait</option>
              <option value="plus que parfait">Plus-que-parfait</option> 
              <option value="futur simple">Futur simple</option>
              <option value="passé simple">Passé simple</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-2 pt-4 border-t border-border/50 gap-4">
            <p className="text-sm text-text-muted">
              Define el tema, tu nivel, los verbos y el tiempo gramatical para la IA.
            </p>
            <button
              onClick={handleGenerate}
              disabled={topic.trim() === "" || isLoading}
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md"
            >
              {isLoading ? "Generando..." : "Generar Ejercicio"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface p-5 rounded-xl border-l-4 border-l-menu-active border-y border-r border-border shadow-sm animate-in fade-in zoom-in-95 duration-200 gap-4">
          <div>
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider block mb-1">
              {isLoading ? "Generando ejercicio..." : "Contexto Actual"}
            </span>
            <p className={`text-lg font-bold text-primary ${isLoading ? 'animate-pulse' : ''}`}>
              {savedContextDisplay}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleChange}
              disabled={isLoading}
              className="text-sm text-primary underline hover:text-menu-active hover:bg-gray-50 px-4 py-2 rounded transition-all whitespace-nowrap font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cambiar configuración
            </button>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold py-2 px-6 rounded-lg transition-all shadow-md whitespace-nowrap"
            >
              {isLoading ? "Generando..." : "Generar Ejercicio"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}