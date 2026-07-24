"use client";

import { useEffect } from "react";

const THEME_KEY = "verboflete-theme";

function getPreferredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeInitializer() {
  useEffect(() => {
    const applyTheme = (theme: "light" | "dark") => {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    };

    const theme = getPreferredTheme();
    applyTheme(theme);

    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY) {
        const next = event.newValue === "dark" ? "dark" : "light";
        applyTheme(next);
      }
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = (event: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (stored !== "dark" && stored !== "light") {
        applyTheme(event.matches ? "dark" : "light");
      }
    };

    window.addEventListener("storage", onStorage);
    mediaQuery.addEventListener("change", onMediaChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      mediaQuery.removeEventListener("change", onMediaChange);
    };
  }, []);

  return null;
}
