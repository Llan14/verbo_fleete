"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const THEME_KEY = "verboflete-theme";

type ThemeMode = "light" | "dark";

function getPreferredTheme(): ThemeMode {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(THEME_KEY, theme);
}

export default function ThemeToggleGlobal() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeMode>("light");

  const cleanPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const hideOnAuthScreens = cleanPath === "/login" || cleanPath === "/recuperar-acceso";

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    const resolved = current === "dark" || current === "light" ? current : getPreferredTheme();
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  const onToggle = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  if (hideOnAuthScreens) {
    return null;
  }

  return (
    <button
      onClick={onToggle}
      className="fixed bottom-5 right-5 z-[80] rounded-full border border-border bg-surface px-4 py-2 text-xs font-black text-primary shadow-lg transition hover:scale-105 hover:bg-primary/10"
      aria-label="Cambiar modo global"
      title="Cambiar modo"
    >
      {theme === "dark" ? "☀ Modo Claro" : "🌙 Modo Oscuro"}
    </button>
  );
}
