"use client";

import { useState, ReactNode, HTMLAttributes } from "react";
import { clsx } from "clsx";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  theme?: "light" | "dark" | "auto";
  enableGlow?: boolean;
}

export const GlassCard = ({
  children,
  className,
  theme = "auto",
  enableGlow = true,
  ...props
}: GlassCardProps) => {
  const [glow, setGlow] = useState({ x: 50, y: 35, active: false });

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableGlow) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  };

  return (
    <div
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setGlow((prev) => ({ ...prev, active: false }))}
      className={clsx(
        "relative isolate overflow-hidden rounded-3xl border p-7 backdrop-blur-md transition-all duration-300",
        // Tema automático: lee directo las variables de globals.css
        theme === "auto" && "glass-panel",
        // Forzados
        theme === "dark" && "bg-slate-900/65 text-white border-white/10 shadow-slate-950/50",
        theme === "light" && "bg-white/80 text-slate-900 border-slate-200/80 shadow-slate-200/50",
        className
      )}
      {...props}
    >
      {/* Luz Interactiva Radial */}
      {enableGlow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 opacity-40 dark:opacity-30"
          style={{
            opacity: glow.active ? 0.8 : undefined,
            background:
              theme === "dark"
                ? `radial-gradient(360px circle at ${glow.x}% ${glow.y}%, rgba(125, 211, 252, 0.24), transparent 58%)`
                : theme === "light"
                ? `radial-gradient(340px circle at ${glow.x}% ${glow.y}%, rgba(14, 165, 233, 0.18), transparent 60%)`
                : `radial-gradient(350px circle at ${glow.x}% ${glow.y}%, rgba(14, 165, 233, 0.15), transparent 60%)`,
          }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};