"use client";
import { useEffect, useState, type FC, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { Inter } from "next/font/google";
import { clsx } from "clsx";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { loginUser } from "@/services/authService";
import { normalizeRole, roleHomePath } from "@/lib/rbac";

const inter = Inter({ subsets: ["latin"] });
const THEME_KEY = "verboflete-theme";

type ThemeMode = "light" | "dark";
type ParallaxOffset = { x: number; y: number };
type GlowState = { x: number; y: number; active: boolean };

type InputProps = ComponentProps<"input"> & {
  icon: LucideIcon;
  label: string;
};

const InputWithIcon: FC<InputProps> = ({ icon: Icon, label, id, className, ...props }) => {
  const describedBy = props["aria-invalid"] ? `${id}-error` : undefined;

  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-300">
        <Icon size={18} aria-hidden="true" />
      </div>
      <input
        id={id}
        aria-describedby={describedBy}
        className={clsx(
          "w-full rounded-xl border py-3 pl-10 pr-4 text-sm transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
          "bg-white/65 text-slate-900 placeholder:text-slate-500 border-slate-200/60",
          "dark:bg-slate-900/40 dark:text-white dark:placeholder:text-slate-300 dark:border-white/10",
          className,
        )}
        {...props}
      />
    </div>
  );
};

const LoginPage: FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [parallax, setParallax] = useState<ParallaxOffset>({ x: 0, y: 0 });
  const [glow, setGlow] = useState<GlowState>({ x: 50, y: 35, active: false });

  useEffect(() => {
    // Leer el tema inicial del DOM
    const current = document.documentElement.getAttribute("data-theme");
    const stored = localStorage.getItem(THEME_KEY);
    const initial = (stored === "light" || stored === "dark"
      ? stored
      : current === "light" || current === "dark"
        ? current
        : "dark") as ThemeMode;

    setTheme(initial);
    setMounted(true);

    // Listener para reaccionar al cambio desde ThemeToggleGlobal
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue);
      }
    };

    // Observer por si data-theme cambia en <html> directamente
    const observer = new MutationObserver(() => {
      const activeAttr = document.documentElement.getAttribute("data-theme") as ThemeMode | null;
      if (activeAttr && (activeAttr === "light" || activeAttr === "dark")) {
        setTheme(activeAttr);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("storage", handleStorageChange);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReduceMotion(media.matches);
    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
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

  const handleCardPointerMove = (event: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setGlow({ x, y, active: true });
  };

  const handleCardPointerLeave = () => {
    setGlow({ x: 50, y: 35, active: false });
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Ingresa correo y contraseña.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.access_token);

      Cookies.set("token", data.access_token, {
        expires: 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      Cookies.set("access_token", data.access_token, {
        expires: 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      if (!response.ok) {
        throw new Error("No fue posible validar tu perfil.");
      }

      const userData: { rol: string } = await response.json();
      const normalizedRole = normalizeRole(userData.rol);
      router.push(roleHomePath(normalizedRole));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
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
                transform: `scale(1.04) translate3d(${parallax.x * -14}px, ${parallax.y * -10}px, 0)`,
              }
        }
      />
      <div
        className={clsx(
          "fixed inset-0 -z-10",
          theme === "dark"
            ? "bg-gradient-to-br from-slate-950/65 via-slate-900/45 to-slate-950/70"
            : "bg-gradient-to-br from-slate-900/35 via-slate-900/15 to-slate-900/45",
        )}
        aria-hidden="true"
      />

      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-10">
        <section className="hidden lg:block lg:w-1/2 lg:pr-10">
          <div
            className={clsx(
              "max-w-xl rounded-3xl border p-8 backdrop-blur-md",
              "transition-all duration-700",
              mounted ? "opacity-100" : "opacity-0",
              theme === "dark"
                ? "border-white/10 bg-slate-900/35 text-white"
                : "border-slate-200/40 bg-white/35 text-slate-900",
            )}
            style={{
              transform: reduceMotion
                ? `translate3d(0, ${mounted ? 0 : 16}px, 0)`
                : `translate3d(${parallax.x * 16}px, ${(mounted ? 0 : 16) + parallax.y * 12}px, 0)`,
            }}
          >
            <p className={clsx("text-xs font-semibold uppercase tracking-[0.22em]", theme === "dark" ? "text-sky-200" : "text-sky-700")}>
              Plataforma Academica Inteligente
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">
              MasterHubTraining
            </h2>
            <p className={clsx("mt-4 text-base leading-relaxed", theme === "dark" ? "text-slate-200" : "text-slate-700")}>
              Gestiona sesiones, practica habilidades clave y sigue el avance de cada estudiante desde una sola plataforma.
            </p>
          </div>
        </section>

        <div className="flex w-full lg:w-1/2 lg:justify-end">
          <section
            aria-labelledby="login-title"
            onMouseMove={handleCardPointerMove}
            onMouseLeave={handleCardPointerLeave}
            className={clsx(
              "relative isolate w-full max-w-md overflow-hidden rounded-3xl border p-7 shadow-2xl backdrop-blur-md sm:p-8",
              "transition-all duration-700",
              mounted ? "opacity-100" : "opacity-0",
              theme === "dark"
                ? "bg-slate-900/60 text-white border-white/10"
                : "bg-white/70 text-slate-900 border-slate-200/50",
            )}
            style={{
              transform: reduceMotion
                ? `translate3d(0, ${mounted ? 0 : 24}px, 0)`
                : `translate3d(${parallax.x * -10}px, ${(mounted ? 0 : 24) + parallax.y * -8}px, 0)`,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
              style={{
                opacity: reduceMotion ? 0 : glow.active ? 1 : 0.45,
                background:
                  theme === "dark"
                    ? `radial-gradient(360px circle at ${glow.x}% ${glow.y}%, rgba(125, 211, 252, 0.24), transparent 58%)`
                    : `radial-gradient(340px circle at ${glow.x}% ${glow.y}%, rgba(14, 165, 233, 0.2), transparent 60%)`,
              }}
            />

            <div className="relative z-10">
              <div className="mb-6">
                <header>
                  <h1 id="login-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    MasterHubTraining
                  </h1>
                  <p className={clsx("mt-1 text-sm", theme === "dark" ? "text-slate-300" : "text-slate-600")}>
                    Acceso a la Plataforma Académica
                  </p>
                </header>
              </div>

              <form className="space-y-4" onSubmit={handleLogin} noValidate>
                <InputWithIcon
                  id="email"
                  name="email"
                  label="Correo institucional"
                  type="email"
                  icon={Mail}
                  placeholder="tu.correo@institucion.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                  aria-invalid={Boolean(error) && !email}
                />

                <div className="relative">
                  <InputWithIcon
                    id="password"
                    name="password"
                    label="Contraseña"
                    type={isPasswordVisible ? "text" : "password"}
                    icon={Lock}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={isLoading}
                    className="pr-12"
                    aria-invalid={Boolean(error) && !password}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 transition hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                    aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                    disabled={isLoading}
                  >
                    {isPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>

                {error && (
                  <p id="password-error" role="alert" className="text-sm font-medium text-rose-300 dark:text-rose-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={clsx(
                    "mt-2 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white",
                    "bg-sky-500 shadow-lg shadow-sky-900/25 transition",
                    "hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70",
                    "disabled:cursor-not-allowed disabled:opacity-70",
                  )}
                >
                  {isLoading ? "Ingresando..." : "Ingresar"}
                </button>

                <div className="pt-1 text-center">
                  <Link
                    href="/recuperar-acceso"
                    className={clsx(
                      "text-sm font-medium underline-offset-4 transition hover:underline",
                      theme === "dark" ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-slate-900",
                    )}
                  >
                    Olvide mi contraseña
                  </Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;