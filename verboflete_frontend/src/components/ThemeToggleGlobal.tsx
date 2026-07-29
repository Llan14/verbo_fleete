"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { clsx } from "clsx";

const THEME_KEY = "verboflete-theme";
type ThemeMode = "light" | "dark";

export default function ThemeToggleGlobal() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Lee el tema ya aplicado en <html> por ThemeInitializer
    const root = document.documentElement;
    const currentAttr = root.getAttribute("data-theme") as ThemeMode | null;
    const isDarkClass = root.classList.contains("dark");

    const activeTheme: ThemeMode =
      currentAttr || (isDarkClass ? "dark" : "light");

    setTheme(activeTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

    // 1. Actualizar estado local
    setTheme(nextTheme);

    // 2. Persistir en localStorage
    localStorage.setItem(THEME_KEY, nextTheme);

    // 3. Aplicar al DOM
    const root = document.documentElement;
    root.setAttribute("data-theme", nextTheme);
    root.classList.toggle("dark", nextTheme === "dark");

    // 4. Disparar evento de storage para sincronizar otros componentes/pestañas
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: THEME_KEY,
        newValue: nextTheme,
      })
    );
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={
        theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
      className={clsx(
        "fixed bottom-6 right-6 z-[9999] flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 shadow-2xl backdrop-blur-xl cursor-pointer active:scale-95",
        theme === "dark"
          ? "border-white/20 bg-slate-900/80 text-yellow-300 hover:bg-slate-800 hover:border-yellow-400/40 shadow-slate-950/60"
          : "border-slate-300/80 bg-white/80 text-slate-800 hover:bg-white hover:border-sky-400/50 shadow-slate-900/20"
      )}
    >
      {theme === "dark" ? (
        <Sun
          size={20}
          className="transition-transform duration-300 hover:rotate-45"
          aria-hidden="true"
        />
      ) : (
        <Moon
          size={20}
          className="transition-transform duration-300 hover:-rotate-12"
          aria-hidden="true"
        />
      )}
    </button>
  );
}