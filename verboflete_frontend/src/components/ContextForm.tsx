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
    <div className="mt-2 mb-4 font-sans">
      {!isContextSet ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <label className="text-lg font-bold text-slate-900 dark:text-white">
            ¿Qué quieres practicar hoy?
          </label>
          
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej: Viajes, Entrevista de trabajo, Un día en París..."
            className="border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/40 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-base w-full outline-none focus:border-sky-500 dark:focus:border-sky-400 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            disabled={isLoading}
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 cursor-pointer text-sm shadow-sm"
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
              className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 cursor-pointer text-sm shadow-sm"
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
              className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 cursor-pointer text-sm font-medium shadow-sm"
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
              className="border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 cursor-pointer text-sm font-medium shadow-sm"
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

          <div className="flex flex-col sm:flex-row items-center justify-between mt-2 pt-4 border-t border-slate-200 dark:border-white/10 gap-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Define el tema, tu nivel, los verbos y el tiempo gramatical para la IA.
            </p>
            <button
              onClick={handleGenerate}
              disabled={topic.trim() === "" || isLoading}
              className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-sky-950/20 cursor-pointer"
            >
              {isLoading ? "Generando..." : "Generar Ejercicio"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-sky-50/50 dark:bg-slate-950/40 border-l-4 border-l-sky-500 dark:border-l-sky-400 border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-md animate-in fade-in duration-200 gap-4">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {isLoading ? "Generando ejercicio..." : "Contexto Actual"}
            </span>
            <p className={`text-base md:text-lg font-bold text-slate-900 dark:text-white ${isLoading ? 'animate-pulse' : ''}`}>
              {savedContextDisplay}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleChange}
              disabled={isLoading}
              className="text-sm text-sky-700 dark:text-sky-300 underline hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 px-4 py-2 rounded-xl transition-all whitespace-nowrap font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cambiar configuración
            </button>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-sky-950/20 whitespace-nowrap cursor-pointer"
            >
              {isLoading ? "Generando..." : "Generar Ejercicio"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}