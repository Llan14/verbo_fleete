"use client";

import { useEffect, useState, ReactNode } from "react";
import { clsx } from "clsx";

interface BackgroundLayoutProps {
  children: ReactNode;
  theme?: "light" | "dark";
}

export const BackgroundLayout = ({ children, theme = "dark" }: BackgroundLayoutProps) => {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);

    if (media.matches) return;

    const handleMouseMove = (event: MouseEvent) => {
      setParallax({
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Video de Fondo con Parallax */}
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
                transform: `scale(1.04) translate3d(${parallax.x * -14}px, ${parallax.y * -10}px, 0)`,
              }
        }
      />

      {/* Capa de Gradiente */}
      <div
        className={clsx(
          "fixed inset-0 -z-10 transition-colors duration-300",
          theme === "dark"
            ? "bg-gradient-to-br from-slate-950/65 via-slate-900/45 to-slate-950/70"
            : "bg-gradient-to-br from-slate-900/35 via-slate-900/15 to-slate-900/45"
        )}
        aria-hidden="true"
      />

      {/* Contenido de la página */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};