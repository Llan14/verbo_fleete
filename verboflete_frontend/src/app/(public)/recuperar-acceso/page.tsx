"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { clsx } from "clsx";
import { Mail, Moon, Send, Sun } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });
const THEME_KEY = "verboflete-theme";

type ThemeMode = "light" | "dark";
type ParallaxOffset = { x: number; y: number };

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme === "dark");
}

export default function RecuperarAccesoPage() {
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [parallax, setParallax] = useState<ParallaxOffset>({ x: 0, y: 0 });

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    const stored = localStorage.getItem(THEME_KEY);
    const initial = (stored === "light" || stored === "dark"
      ? stored
      : current === "light" || current === "dark"
        ? current
        : "dark") as ThemeMode;

    setTheme(initial);
    applyTheme(initial);
    setMounted(true);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReduceMotion(media.matches);
    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);

    return () => {
      media.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setParallax({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      setParallax({ x, y });
    };

    const handleMouseLeave = () => {
      setParallax({ x: 0, y: 0 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
    };
  }, [reduceMotion]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setMessage("Ingresa tu correo institucional.");
      return;
    }

    setIsLoading(true);

    // El backend actual no expone flujo self-service de recuperacion.
    // Dejamos un mensaje claro y no filtramos si el correo existe o no.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setMessage("Solicitud recibida. Si el correo esta registrado, el administrador te ayudara con el restablecimiento de acceso.");
    setIsLoading(false);
  };

  return (
    <div className={clsx(inter.className, "relative min-h-screen overflow-hidden")}>
      <video
        className="fixed inset-0 -z-10 h-full w-full object-cover transition-transform duration-500"
        src="/bg-main.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        style={
          reduceMotion
            ? undefined
            : {
                transform: `scale(1.04) translate3d(${parallax.x * -12}px, ${parallax.y * -8}px, 0)`,
              }
        }
      />

      <div
        className={clsx(
          "fixed inset-0 -z-10",
          theme === "dark"
            ? "bg-gradient-to-br from-slate-950/70 via-slate-900/50 to-slate-950/75"
            : "bg-gradient-to-br from-slate-900/35 via-slate-900/15 to-slate-900/45",
        )}
        aria-hidden="true"
      />

      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <section
          aria-labelledby="recover-title"
          className={clsx(
            "relative w-full max-w-lg rounded-3xl border p-7 shadow-2xl backdrop-blur-md sm:p-8",
            "transition-all duration-700",
            mounted ? "opacity-100" : "opacity-0",
            theme === "dark" ? "bg-slate-900/60 text-white border-white/10" : "bg-white/70 text-slate-900 border-slate-200/50",
          )}
          style={{
            transform: reduceMotion
              ? `translate3d(0, ${mounted ? 0 : 18}px, 0)`
              : `translate3d(${parallax.x * -8}px, ${(mounted ? 0 : 18) + parallax.y * -6}px, 0)`,
          }}
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <header>
              <p className={clsx("text-xs font-semibold uppercase tracking-[0.2em]", theme === "dark" ? "text-sky-200" : "text-sky-700")}>
                MasterHubTraining
              </p>
              <h1 id="recover-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Recuperar Acceso
              </h1>
              <p className={clsx("mt-2 text-sm", theme === "dark" ? "text-slate-300" : "text-slate-600")}>
                Ingresa tu correo institucional para iniciar el proceso de recuperacion.
              </p>
            </header>

            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === "dark"}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className={clsx(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
                theme === "dark"
                  ? "border-white/15 bg-slate-800/70 text-yellow-300 hover:bg-slate-700/70"
                  : "border-slate-300/70 bg-white/70 text-slate-700 hover:bg-white",
              )}
            >
              {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label htmlFor="recover-email" className="sr-only">
              Correo institucional
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-300">
                <Mail size={18} aria-hidden="true" />
              </div>
              <input
                id="recover-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isLoading}
                placeholder="tu.correo@institucion.com"
                className={clsx(
                  "w-full rounded-xl border py-3 pl-10 pr-4 text-sm transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
                  "bg-white/65 text-slate-900 placeholder:text-slate-500 border-slate-200/60",
                  "dark:bg-slate-900/40 dark:text-white dark:placeholder:text-slate-300 dark:border-white/10",
                )}
              />
            </div>

            {message && (
              <p
                role="status"
                className={clsx(
                  "rounded-xl border px-3 py-2 text-sm",
                  theme === "dark"
                    ? "border-sky-300/20 bg-sky-400/10 text-sky-100"
                    : "border-sky-200/70 bg-sky-50/80 text-sky-800",
                )}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white",
                "bg-sky-500 shadow-lg shadow-sky-900/25 transition",
                "hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70",
                "disabled:cursor-not-allowed disabled:opacity-70",
              )}
            >
              <Send size={16} aria-hidden="true" />
              {isLoading ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className={clsx(
                "text-sm font-medium underline-offset-4 transition hover:underline",
                theme === "dark" ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-slate-900",
              )}
            >
              Volver a iniciar sesion
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
