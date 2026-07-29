"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  is_active: boolean;
}

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState("");

  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [pwdConfirmar, setPwdConfirmar] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMensaje, setPwdMensaje] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const token = getClientToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
        if (!res.ok) throw new Error("Error al cargar los datos del perfil");

        const data = await res.json();
        setUsuario(data);
      } catch (err: any) {
        setErrorInfo(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, []);

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMensaje(null);

    if (pwdNueva !== pwdConfirmar) {
      setPwdMensaje({ texto: "Las contraseñas nuevas no coinciden.", tipo: "error" });
      return;
    }
    if (pwdNueva.length < 6) {
      setPwdMensaje({ texto: "La nueva contraseña debe tener al menos 6 caracteres.", tipo: "error" });
      return;
    }
    if (!usuario) return;

    setPwdLoading(true);

    try {
      const token = getClientToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${usuario.id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          password_actual: pwdActual,
          password_nueva: pwdNueva
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Error al actualizar la contraseña");
      }

      setPwdMensaje({ texto: "¡Contraseña actualizada con éxito!", tipo: "exito" });
      
      setPwdActual("");
      setPwdNueva("");
      setPwdConfirmar("");
      
    } catch (err: any) {
      setPwdMensaje({ texto: err.message, tipo: "error" });
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="font-sans animate-in fade-in slide-in-from-top-4 duration-700 space-y-8">
      
      <div className="border-b border-slate-200 dark:border-white/10 pb-5">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Configuración de Cuenta
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
          Gestiona tu información personal y la seguridad de tu cuenta.
        </p>
      </div>

      {errorInfo && (
        <div className="bg-rose-500/10 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 p-4 rounded-2xl border border-rose-500/30 backdrop-blur-md">
          {errorInfo}
        </div>
      )}

      {usuario && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Tarjeta Datos Personales */}
          <GlassCard className="p-6 md:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 text-sky-700 dark:text-sky-300 rounded-2xl flex items-center justify-center text-2xl font-black uppercase shadow-inner">
                {usuario.nombre.charAt(0)}{usuario.apellidos.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">Datos Personales</h2>
                <span className="text-[10px] uppercase font-black tracking-widest bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded mt-1 inline-block">
                  Rol: {usuario.rol}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre</label>
                <div className="w-full bg-slate-100/80 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium px-4 py-3 rounded-xl opacity-75 cursor-not-allowed">
                  {usuario.nombre}
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Apellidos</label>
                <div className="w-full bg-slate-100/80 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium px-4 py-3 rounded-xl opacity-75 cursor-not-allowed">
                  {usuario.apellidos}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <div className="w-full bg-slate-100/80 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium px-4 py-3 rounded-xl opacity-75 cursor-not-allowed">
                  {usuario.email}
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-6 text-center">
              Para modificar tus datos personales, por favor contacta a tu profesor o al administrador.
            </p>
          </GlassCard>

          {/* Tarjeta Seguridad */}
          <GlassCard className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              🔒 Seguridad
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Actualiza tu contraseña para mantener tu cuenta segura.
            </p>

            {pwdMensaje && (
              <div className={`p-4 rounded-xl mb-6 text-sm font-medium border backdrop-blur-md ${
                pwdMensaje.tipo === "exito" 
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/30" 
                  : "bg-rose-500/10 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-500/30"
              }`}>
                {pwdMensaje.texto}
              </div>
            )}

            <form onSubmit={handleCambiarPassword} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={pwdActual}
                  onChange={(e) => setPwdActual(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium px-4 py-3 rounded-xl focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                  placeholder="Escribe tu contraseña actual"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={pwdNueva}
                  onChange={(e) => setPwdNueva(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium px-4 py-3 rounded-xl focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={pwdConfirmar}
                  onChange={(e) => setPwdConfirmar(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium px-4 py-3 rounded-xl focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                  placeholder="Repite la nueva contraseña"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={pwdLoading || !pwdActual || !pwdNueva || !pwdConfirmar}
                  className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-sky-900/20 flex justify-center items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {pwdLoading && (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {pwdLoading ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </div>
            </form>
          </GlassCard>

        </div>
      )}
    </div>
  );
}