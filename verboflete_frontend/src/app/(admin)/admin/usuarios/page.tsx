"use client";

import { getClientToken } from "@/lib/authToken";
import Cookies from "js-cookie";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  is_active: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
  ? process.env.NEXT_PUBLIC_API_URL
  : "http://127.0.0.1:8000/api";

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    rol: "estudiante",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: 0,
    nombre: "",
    apellidos: "",
    email: "",
    rol: "estudiante",
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetFormData, setResetFormData] = useState({
    id: 0,
    email: "",
    nueva_password: "",
  });

  const [isAssignChildModalOpen, setIsAssignChildModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<{
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
  } | null>(null);
  const [selectedChildId, setSelectedChildId] = useState("");

  const authHeaders = () => {
    const token = getClientToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchUsuarios = async () => {
    const resUsuarios = await fetch(`${API_BASE}/usuarios/?limit=1000`, {
      headers: authHeaders(),
    });

    if (!resUsuarios.ok) {
      throw new Error("Error al cargar la lista de usuarios");
    }

    const dataUsuarios = await resUsuarios.json();
    setUsuarios(dataUsuarios);
  };

  useEffect(() => {
    const inicializarPantalla = async () => {
      try {
        const token = getClientToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const resMe = await fetch(`${API_BASE}/usuarios/me`, {
          headers: authHeaders(),
        });

        if (resMe.status === 401) {
          router.push("/login");
          return;
        }

        if (!resMe.ok) {
          throw new Error("Error de sesión");
        }

        const userData = await resMe.json();
        if (userData.rol !== "admin" && userData.rol !== "administrador") {
          router.push("/dashboard");
          return;
        }

        await fetchUsuarios();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error en admin");
      } finally {
        setLoading(false);
      }
    };

    inicializarPantalla();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    Cookies.remove("token");
    Cookies.remove("access_token");
    sessionStorage.removeItem("verboFleteContext");
    router.replace("/login");
    router.refresh();
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const termino = busqueda.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(termino) ||
      u.apellidos.toLowerCase().includes(termino) ||
      u.email.toLowerCase().includes(termino)
    );
  });

  const alumnosDisponibles = usuarios.filter((u) => u.rol === "estudiante");

  const toggleEstadoUsuario = async (id: number, isActiveActual: boolean) => {
    try {
      const url = isActiveActual
        ? `${API_BASE}/usuarios/${id}`
        : `${API_BASE}/usuarios/${id}/reactivar`;

      const method = isActiveActual ? "DELETE" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
      });

      if (!res.ok) {
        throw new Error("Error al cambiar el estado del usuario");
      }

      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !isActiveActual } : u))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/usuarios/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al crear usuario");
      }

      await fetchUsuarios();
      setIsModalOpen(false);
      setFormData({ nombre: "", apellidos: "", email: "", password: "", rol: "estudiante" });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setLoadingAction(false);
    }
  };

  const abrirModalEditar = (u: Usuario) => {
    setEditFormData({
      id: u.id,
      nombre: u.nombre,
      apellidos: u.apellidos,
      email: u.email,
      rol: u.rol,
    });
    setIsEditModalOpen(true);
  };

  const handleEditarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/usuarios/${editFormData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          nombre: editFormData.nombre,
          apellidos: editFormData.apellidos,
          email: editFormData.email,
          rol: editFormData.rol,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al actualizar usuario");
      }

      await fetchUsuarios();
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "No se pudo actualizar el usuario");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarDefinitivo = async (id: number, email: string) => {
    const confirmacion = window.confirm(`⚠️ ADVERTENCIA: ¿Estás completamente seguro de que deseas ELIMINAR a ${email}? Esta acción borrará todo su historial y no se puede deshacer.`);
    if (!confirmacion) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/usuarios/${id}/hard-delete`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al eliminar usuario permanentemente");
      }

      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      alert("Usuario eliminado correctamente.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar el usuario");
    }
  };

  const abrirModalReset = (u: Usuario) => {
    setResetFormData({ id: u.id, email: u.email, nueva_password: "" });
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/usuarios/${resetFormData.id}/reset-password-admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ nueva_password: resetFormData.nueva_password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al resetear la contraseña");
      }

      alert(`Contraseña actualizada exitosamente para ${resetFormData.email}`);
      setIsResetModalOpen(false);
      setResetFormData({ id: 0, email: "", nueva_password: "" });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "No se pudo resetear la contraseña");
    } finally {
      setLoadingAction(false);
    }
  };

  const abrirModalAsignarHijo = (u: Usuario) => {
    setSelectedParent({ id: u.id, nombre: u.nombre, apellidos: u.apellidos, email: u.email });
    setSelectedChildId("");
    setIsAssignChildModalOpen(true);
  };

  const handleAsignarHijo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParent || !selectedChildId) {
      alert("Selecciona un alumno para vincular.");
      return;
    }

    setLoadingAction(true);
    try {
      const res = await fetch(`${API_BASE}/usuarios/padres/${selectedParent.id}/hijos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ alumno_id: Number(selectedChildId) }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "No se pudo vincular el alumno.");
      }

      alert("Alumno vinculado correctamente al padre de familia.");
      setIsAssignChildModalOpen(false);
      setSelectedParent(null);
      setSelectedChildId("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "No se pudo vincular el alumno");
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium text-sm">Cargando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Administra accesos, roles y estados de los alumnos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleLogout}
            className="bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 font-bold py-2.5 px-4 rounded-xl transition-all border border-rose-500/30 flex items-center gap-2 justify-center cursor-pointer shadow-sm"
          >
            Cerrar Sesión
          </button>

          <Link
            href="/admin/grupos"
            className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold py-2.5 px-5 rounded-xl transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2 justify-center backdrop-blur-md shadow-sm"
          >
            Gestión de Grupos
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-sky-500 hover:bg-sky-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-sky-950/20 flex items-center gap-2 justify-center cursor-pointer"
          >
            <span>+</span> Nuevo Usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-800 dark:text-rose-200 font-medium px-4 py-3 rounded-xl relative text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Barra de Búsqueda */}
      <GlassCard className="p-4 flex items-center gap-3">
        <span className="text-xl">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre, apellidos o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
        />
      </GlassCard>

      {/* Tabla de Usuarios */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-white/10 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold">
                <th className="p-5">Usuario</th>
                <th className="p-5">Correo</th>
                <th className="p-5 text-center">Rol</th>
                <th className="p-5 text-center">Estado</th>
                <th className="p-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 bg-white/50 dark:bg-transparent">
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/20 dark:border-sky-400/30 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm shrink-0">
                          {u.nombre.charAt(0)}
                          {u.apellidos.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white capitalize whitespace-nowrap">
                            {u.nombre} {u.apellidos}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 font-medium text-slate-700 dark:text-slate-300">{u.email}</td>
                    <td className="p-5 text-center">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 px-2 py-1 rounded">
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      {u.is_active ? (
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full whitespace-nowrap">
                          Activo
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full whitespace-nowrap">
                          Suspendido
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/admin/usuarios/detalle?id=${u.id}`}
                        className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 dark:bg-sky-500/20 hover:bg-sky-500/20 dark:hover:bg-sky-500/30 border border-sky-500/20 dark:border-sky-400/30 px-3 py-1.5 rounded-lg transition-colors inline-block"
                      >
                        Progreso
                      </Link>
                      <button
                        onClick={() => abrirModalEditar(u)}
                        className="text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg transition-colors inline-block cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => abrirModalReset(u)}
                        className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors inline-block cursor-pointer"
                      >
                        Clave
                      </button>
                      {(u.rol === "padres" || u.rol === "parent") && (
                        <button
                          onClick={() => abrirModalAsignarHijo(u)}
                          className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors inline-block cursor-pointer"
                        >
                          Asignar Hijo
                        </button>
                      )}
                      <button
                        onClick={() => toggleEstadoUsuario(u.id, u.is_active)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors inline-block cursor-pointer border ${
                          u.is_active
                            ? "text-rose-800 dark:text-rose-300 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 hover:bg-rose-500/20 dark:hover:bg-rose-500/30"
                            : "text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30"
                        }`}
                      >
                        {u.is_active ? "Suspender" : "Reactivar"}
                      </button>
                      <button
                        onClick={() => handleEliminarDefinitivo(u.id, u.email)}
                        className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg transition-colors inline-block shadow-sm cursor-pointer"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No se encontraron usuarios con "{busqueda}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modal Nuevo Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <GlassCard className="w-full max-w-md p-6 md:p-8 relative border-slate-200 dark:border-white/15">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold cursor-pointer">✕</button>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Nuevo Usuario</h2>
            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nombre</label>
                  <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Apellidos</label>
                  <input type="text" required value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Correo Electrónico</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Contraseña Temporal</label>
                <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Rol del Sistema</label>
                <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 font-medium text-sm shadow-sm">
                  <option value="estudiante">Estudiante</option>
                  <option value="tutor">Tutor / Maestro</option>
                  <option value="padres">Padres de Familia</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loadingAction} className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md">
                  {loadingAction ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <GlassCard className="w-full max-w-md p-6 md:p-8 relative border-slate-200 dark:border-white/15">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold cursor-pointer">✕</button>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Editar Usuario</h2>
            <form onSubmit={handleEditarUsuario} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nombre</label>
                  <input type="text" required value={editFormData.nombre} onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })} className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Apellidos</label>
                  <input type="text" required value={editFormData.apellidos} onChange={(e) => setEditFormData({ ...editFormData, apellidos: e.target.value })} className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Correo Electrónico</label>
                <input type="email" required value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm shadow-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Rol del Sistema</label>
                <select value={editFormData.rol} onChange={(e) => setEditFormData({ ...editFormData, rol: e.target.value })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 font-medium text-sm shadow-sm">
                  <option value="estudiante">Estudiante</option>
                  <option value="tutor">Tutor / Maestro</option>
                  <option value="padres">Padres de Familia</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loadingAction} className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md">
                  {loadingAction ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Modal Resetear Clave */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <GlassCard className="w-full max-w-sm p-6 md:p-8 relative border-slate-200 dark:border-white/15">
            <button onClick={() => setIsResetModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold cursor-pointer">✕</button>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🔑</div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Resetear Clave</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 break-all">{resetFormData.email}</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nueva Contraseña</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Temporal123!"
                  value={resetFormData.nueva_password}
                  onChange={(e) => setResetFormData({ ...resetFormData, nueva_password: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-3 rounded-xl outline-none focus:border-amber-500 dark:focus:border-amber-400 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm shadow-sm"
                />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loadingAction} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer">
                  {loadingAction ? "Guardando..." : "Confirmar Cambio"}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Modal Asignar Hijo */}
      {isAssignChildModalOpen && selectedParent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <GlassCard className="w-full max-w-md p-6 md:p-8 relative border-slate-200 dark:border-white/15">
            <button onClick={() => setIsAssignChildModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold cursor-pointer">✕</button>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Asignar Hijo</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Padre: {selectedParent.nombre} {selectedParent.apellidos}
            </p>

            <form onSubmit={handleAsignarHijo} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Alumno</label>
                <select
                  required
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 font-medium text-sm shadow-sm"
                >
                  <option value="" disabled>-- Elige un alumno --</option>
                  {alumnosDisponibles.map((alumno) => (
                    <option key={alumno.id} value={alumno.id}>
                      {alumno.nombre} {alumno.apellidos} ({alumno.email})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={loadingAction} className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md">
                {loadingAction ? "Guardando..." : "Vincular Alumno"}
              </button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}