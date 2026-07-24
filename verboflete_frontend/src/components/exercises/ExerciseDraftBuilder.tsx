"use client";

import { useState } from "react";

import ContextForm, { ContextData } from "@/components/ContextForm";
import ExerciseAssignmentRenderer from "@/components/exercises/ExerciseAssignmentRenderer";
import { createExerciseDraft } from "@/services/aiAssignmentsService";
import { ExerciseDraftResponse, ExerciseModule } from "@/types/aiAssignments";

interface ExerciseDraftBuilderProps {
  title: string;
  subtitle: string;
  defaultModule?: ExerciseModule;
  onDraftReady?: (draft: ExerciseDraftResponse, context: ContextData) => void;
}

const moduleOptions: Array<{ value: ExerciseModule; label: string }> = [
  { value: "reading", label: "Lectura" },
  { value: "grammar", label: "Gramática" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
  { value: "listening", label: "Listening" },
];

export default function ExerciseDraftBuilder({
  title,
  subtitle,
  defaultModule = "grammar",
  onDraftReady,
}: ExerciseDraftBuilderProps) {
  const [module, setModule] = useState<ExerciseModule>(defaultModule);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ExerciseDraftResponse | null>(null);

  const handleGenerate = async (context: ContextData) => {
    setIsGenerating(true);
    setError("");
    try {
      const newDraft = await createExerciseDraft({ module, ...context });
      setDraft(newDraft);
      onDraftReady?.(newDraft, context);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo generar el ejercicio.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-black text-primary">{title}</h2>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        Módulo del ejercicio
      </label>
      <select
        value={module}
        onChange={(event) => setModule(event.target.value as ExerciseModule)}
        className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-medium outline-none focus:border-teal-500"
      >
        {moduleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ContextForm onGenerate={handleGenerate} isLoading={isGenerating} />

      {error && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      {draft && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Preview IA</h3>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
              Draft #{draft.draft_id}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <ExerciseAssignmentRenderer
              payload={draft.payload}
              disabled
              showSubmitButton={false}
              onSubmit={async () => {
                return;
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
