"use client";

import { useMemo, useRef, useState } from "react";
import ContextForm, { ContextData } from "@/components/ContextForm";
import ExerciseAssignmentRenderer from "@/components/exercises/ExerciseAssignmentRenderer";
import { createExerciseDraft, createTeacherAssignment, getTutorGroups } from "@/services/aiAssignmentsService";
import { ExerciseDraftResponse, ExerciseModule, TutorGroup } from "@/types/aiAssignments";
import { GlassCard } from "@/components/GlassCard";

const moduleOptions: Array<{ value: ExerciseModule; label: string }> = [
  { value: "reading", label: "Lectura" },
  { value: "grammar", label: "Gramática" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
  { value: "listening", label: "Listening" },
];

export default function TareasGeneradorPage() {
  const [module, setModule] = useState<ExerciseModule>("grammar");
  const [groups, setGroups] = useState<TutorGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<ExerciseDraftResponse | null>(null);
  const [draftContext, setDraftContext] = useState<ContextData | null>(null);

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [groupId, setGroupId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weight, setWeight] = useState(1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastCreatedKey, setLastCreatedKey] = useState<string | null>(null);
  const savingRef = useRef(false);

  const isReadyToAssign = useMemo(() => {
    return Boolean(draft && title.trim() && groupId && dueDate);
  }, [draft, title, groupId, dueDate]);

  const loadGroups = async () => {
    if (groups.length > 0 || loadingGroups) return;

    setLoadingGroups(true);
    try {
      const data = await getTutorGroups();
      setGroups(data);
      if (data.length > 0) {
        setGroupId(String(data[0].id));
      }
    } catch {
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGenerate = async (context: ContextData) => {
    setIsGenerating(true);
    setError("");
    setSuccess("");
    try {
      const generated = await createExerciseDraft({ module, ...context });
      setDraft(generated);
      setDraftContext(context);
      await loadGroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo generar el borrador con IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGuardarComoTarea = async () => {
    if (savingRef.current || saving) return;

    if (!draft || !groupId || !dueDate || !title.trim()) {
      setError("Completa título, grupo y fecha de entrega.");
      return;
    }

    const currentKey = JSON.stringify({
      draft_id: draft.draft_id,
      title: title.trim(),
      instructions: instructions.trim() || "",
      group_id: Number(groupId),
      due_at: `${dueDate}T23:59:00`,
      weight,
    });

    if (lastCreatedKey === currentKey) {
      setError("Esta misma tarea ya fue asignada. Cambia algún campo antes de volver a publicar.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await createTeacherAssignment({
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        group_id: Number(groupId),
        due_at: `${dueDate}T23:59:00`,
        weight,
        draft_id: draft.draft_id,
      });

      setLastCreatedKey(currentKey);
      setSuccess(`Tarea asignada correctamente. ID: ${response.assignment_id}, destinatarios: ${response.recipients_count}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo asignar la tarea.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-sans animate-in fade-in duration-500">
      <div className="border-b border-slate-200 dark:border-white/10 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Generador de Tareas con IA</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Genera ejercicios de francés y publícalos directamente para tus grupos.</p>
      </div>

      <GlassCard className="p-6 md:p-8">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Módulo del ejercicio</label>
        <select
          value={module}
          onChange={(event) => setModule(event.target.value as ExerciseModule)}
          className="mb-4 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white font-medium outline-none focus:border-sky-500 dark:focus:border-sky-400 cursor-pointer text-sm shadow-sm"
        >
          {moduleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ContextForm onGenerate={handleGenerate} isLoading={isGenerating} />
      </GlassCard>

      {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/20 p-4 text-sm text-rose-800 dark:text-rose-200 backdrop-blur-md">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-200 backdrop-blur-md">{success}</div>}

      {draft && (
        <GlassCard className="space-y-6 p-6 md:p-8">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Vista Previa de la Tarea</h2>
            <span className="rounded-full bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-200">
              Draft #{draft.draft_id}
            </span>
          </div>

          <ExerciseAssignmentRenderer
            payload={draft.payload}
            disabled
            showSubmitButton={false}
            onSubmit={async () => { return; }}
          />

          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-slate-200 dark:border-white/10">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Título</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Práctica de passé composé"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Grupo</label>
              <select
                disabled={loadingGroups}
                value={groupId}
                onChange={(event) => setGroupId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm cursor-pointer shadow-sm"
              >
                {groups.length === 0 ? (
                  <option value="">Sin grupos asignados</option>
                ) : (
                  groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Fecha de entrega</label>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Ponderación</label>
              <input
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={weight}
                onChange={(event) => setWeight(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">Instrucciones (opcional)</label>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Ej. Completa los huecos usando el verbo correcto y revisa concordancia."
              className="min-h-[100px] w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              disabled={!isReadyToAssign || saving}
              onClick={handleGuardarComoTarea}
              className="w-full sm:w-auto rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-lg shadow-sky-950/20"
            >
              {saving ? "Asignando..." : "Asignar a Grupo"}
            </button>

            {draftContext && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Contexto usado: {draftContext.contexto} · Nivel {draftContext.nivel} · {draftContext.tense}
              </p>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}