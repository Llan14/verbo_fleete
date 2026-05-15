"use client";

import { useState, useEffect } from "react";

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
        const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
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
      <div className="min-h-screen flex flex-col items-center justify-center text-text-muted">
        <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="font-sans animate-in fade-in slide-in-from-top-4 duration-700">
      
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-black text-primary tracking-tight">
          Configuración de Cuenta
        </h1>
        <p className="text-text-muted mt-2">
          Gestiona tu información personal y la seguridad de tu cuenta.
        </p>
      </div>

      {errorInfo && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-200">
          {errorInfo}
        </div>
      )}

      {usuario && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div className="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-border">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-menu-active text-white rounded-2xl flex items-center justify-center text-2xl font-black uppercase">
                  {usuario.nombre.charAt(0)}{usuario.apellidos.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary capitalize">Datos Personales</h2>
                  <span className="text-[10px] uppercase font-black tracking-widest bg-background border border-border text-text-muted px-2 py-0.5 rounded mt-1 inline-block">
                    Rol: {usuario.rol}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Nombre</label>
                  <div className="w-full bg-background border border-border/60 text-primary font-medium px-4 py-3 rounded-xl opacity-70 cursor-not-allowed">
                    {usuario.nombre}
                  </div>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Apellidos</label>
                  <div className="w-full bg-background border border-border/60 text-primary font-medium px-4 py-3 rounded-xl opacity-70 cursor-not-allowed">
                    {usuario.apellidos}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">Correo Electrónico</label>
                  <div className="w-full bg-background border border-border/60 text-primary font-medium px-4 py-3 rounded-xl opacity-70 cursor-not-allowed">
                    {usuario.email}
                  </div>
                </div>
              </div>
              
              <p className="text-[11px] text-text-muted italic mt-6 text-center">
                Para modificar tus datos personales, por favor contacta a tu profesor o al administrador.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-border">
              <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                🔒 Seguridad
              </h2>
              <p className="text-sm text-text-muted mb-6">
                Actualiza tu contraseña para mantener tu cuenta segura.
              </p>

              {pwdMensaje && (
                <div className={`p-4 rounded-xl mb-6 text-sm font-medium border ${
                  pwdMensaje.tipo === "exito" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {pwdMensaje.texto}
                </div>
              )}

              <form onSubmit={handleCambiarPassword} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={pwdActual}
                    onChange={(e) => setPwdActual(e.target.value)}
                    required
                    className="w-full bg-background border border-border text-primary font-medium px-4 py-3 rounded-xl focus:outline-none focus:border-menu-active focus:ring-1 focus:ring-menu-active transition-all placeholder:text-gray-400"
                    placeholder="Escribe tu contraseña actual"
                  />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={pwdNueva}
                    onChange={(e) => setPwdNueva(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-background border border-border text-primary font-medium px-4 py-3 rounded-xl focus:outline-none focus:border-menu-active focus:ring-1 focus:ring-menu-active transition-all placeholder:text-gray-400"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={pwdConfirmar}
                    onChange={(e) => setPwdConfirmar(e.target.value)}
                    required
                    className="w-full bg-background border border-border text-primary font-medium px-4 py-3 rounded-xl focus:outline-none focus:border-menu-active focus:ring-1 focus:ring-menu-active transition-all placeholder:text-gray-400"
                    placeholder="Repite la nueva contraseña"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={pwdLoading || !pwdActual || !pwdNueva || !pwdConfirmar}
                    className="w-full bg-primary hover:bg-primary-hover disabled:bg-gray-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                  >
                    {pwdLoading && (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {pwdLoading ? "Actualizando..." : "Actualizar Contraseña"}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}