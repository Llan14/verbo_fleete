"use client";

import { useEffect, useMemo, useState } from "react";

type Payload = Record<string, unknown>;

type AssignmentAnswerPayload = Record<string, unknown>;

interface ExerciseAssignmentRendererProps {
  payload: Payload;
  onSubmit: (answersPayload: AssignmentAnswerPayload, score: number | null) => Promise<void> | void;
  disabled?: boolean;
  showSubmitButton?: boolean;
}

function isOption(item: unknown): item is { texto: string; es_correcta?: boolean; explicacion?: string } {
  return Boolean(item && typeof item === "object" && "texto" in item);
}

export default function ExerciseAssignmentRenderer({
  payload,
  onSubmit,
  disabled,
  showSubmitButton = true,
}: ExerciseAssignmentRendererProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers({});
    setSubmitting(false);
    setSubmitted(false);
  }, [payload]);

  const grammarData = useMemo(() => {
    const text = typeof payload.texto_con_huecos === "string" ? payload.texto_con_huecos : null;
    const blanks = Array.isArray(payload.huecos) ? payload.huecos : null;
    if (!text || !blanks) return null;
    return { text, blanks };
  }, [payload]);

  const readingData = useMemo(() => {
    const text = typeof payload.texto_frances === "string" ? payload.texto_frances : null;
    const questions = Array.isArray(payload.preguntas) ? payload.preguntas : null;
    if (!text || !questions) return null;
    return { text, questions };
  }, [payload]);

  const computeScore = () => {
    if (grammarData) {
      let total = 0;
      let correct = 0;
      grammarData.blanks.forEach((blank: any) => {
        const selected = answers[blank.id_hueco];
        if (typeof selected !== "number") return;
        total += 1;
        const options = Array.isArray(blank.opciones) ? blank.opciones : [];
        const correctIndex = options.findIndex((option: unknown) => isOption(option) && option.es_correcta === true);
        if (selected === correctIndex) correct += 1;
      });
      return total > 0 ? Math.round((correct / total) * 100) : null;
    }

    if (readingData) {
      let total = 0;
      let correct = 0;
      readingData.questions.forEach((question: any, questionIndex: number) => {
        const selected = answers[String(questionIndex)];
        if (typeof selected !== "number") return;
        total += 1;
        const options = Array.isArray(question.opciones) ? question.opciones : [];
        const correctIndex = options.findIndex((option: unknown) => isOption(option) && option.es_correcta === true);
        if (selected === correctIndex) correct += 1;
      });
      return total > 0 ? Math.round((correct / total) * 100) : null;
    }

    return null;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const score = computeScore();
      await onSubmit(answers, score);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFallback = () => (
    <div className="space-y-4">
      {Object.entries(payload).map(([key, value]) => (
        <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{key}</p>
          <p className="mt-1 text-sm text-slate-800 break-words">{typeof value === "string" ? value : JSON.stringify(value, null, 2)}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {grammarData && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.35em] text-slate-500 mb-4">Complète l'histoire</h3>
            <p className="text-xl leading-loose text-slate-800 whitespace-pre-wrap font-medium">
              {grammarData.text.split(/(\[BLANK_\d+\])/g).map((part, index) =>
                /\[BLANK_\d+\]/.test(part) ? (
                  <span key={index} className="inline-flex min-w-20 items-center justify-center rounded-lg border-b-2 border-teal-300 bg-teal-50 px-3 py-1 align-baseline text-teal-700">
                    ______
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                )
              )}
            </p>
          </div>

          {grammarData.blanks.map((blank: any, blankIndex: number) => (
            <div key={blank.id_hueco} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-slate-500">Hueco {blankIndex + 1}</p>
                  <p className="text-xs text-slate-500">{blank.explicacion}</p>
                </div>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">Selecciona 1 opción</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(Array.isArray(blank.opciones) ? blank.opciones : []).map((option: unknown, optionIndex: number) => {
                  if (!isOption(option)) return null;
                  const isSelected = answers[blank.id_hueco] === optionIndex;
                  return (
                    <button
                      key={`${blank.id_hueco}-${optionIndex}`}
                      disabled={disabled || submitted}
                      onClick={() => setAnswers((prev) => ({ ...prev, [blank.id_hueco]: optionIndex }))}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-semibold">{option.texto}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {readingData && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.35em] text-slate-500 mb-4">Texte à lire</h3>
            <div className="rounded-2xl bg-slate-50 p-4 text-lg leading-relaxed text-slate-800 whitespace-pre-wrap">
              {readingData.text}
            </div>
          </div>

          {readingData.questions.map((question: any, questionIndex: number) => (
            <div key={questionIndex} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-lg font-bold text-slate-900">
                <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
                  {questionIndex + 1}
                </span>
                {question.pregunta}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(Array.isArray(question.opciones) ? question.opciones : []).map((option: unknown, optionIndex: number) => {
                  if (!isOption(option)) return null;
                  const isSelected = answers[String(questionIndex)] === optionIndex;
                  return (
                    <button
                      key={`${questionIndex}-${optionIndex}`}
                      disabled={disabled || submitted}
                      onClick={() => setAnswers((prev) => ({ ...prev, [String(questionIndex)]: optionIndex }))}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary/30 hover:bg-slate-50"
                      }`}
                    >
                      <p className="font-semibold">{option.texto}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!grammarData && !readingData && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{renderFallback()}</div>
      )}

      {showSubmitButton && (
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            {submitted ? "Tarea enviada" : "Selecciona tus respuestas y envía cuando termines."}
          </p>
          <button
            onClick={handleSubmit}
            disabled={disabled || submitting || submitted}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? "Enviando..." : disabled || submitted ? "Tarea enviada" : "Enviar tarea"}
          </button>
        </div>
      )}
    </div>
  );
}
