"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  is_active: boolean;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [busqueda, setBusqueda] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "", apellidos: "", email: "", password: "", rol: "estudiante"
  });
  const [loadingAction, setLoadingAction] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: 0, nombre: "", apellidos: "", email: "", rol: "estudiante"
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetFormData, setResetFormData] = useState({
    id: 0, email: "", nueva_password: ""
  });

  const fetchUsuarios = async () => {
    const token = localStorage.getItem("token");
    const resUsuarios = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/?limit=1000`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!resUsuarios.ok) throw new Error("Error al cargar la lista de usuarios");
    const dataUsuarios = await resUsuarios.json();
    
    setUsuarios(dataUsuarios);
  };

  useEffect(() => {
    const inicializarPantalla = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const resMe = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!resMe.ok) throw new Error("Error de sesión");
        const userData = await resMe.json();
        
        if (userData.rol !== "admin" && userData.rol !== "administrador") {
          router.push("/dashboard");
          return; 
        }

        await fetchUsuarios();
      } catch (error: any) {
        console.error("Error en admin:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    inicializarPantalla();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const termino = busqueda.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(termino) ||
      u.apellidos.toLowerCase().includes(termino) ||
      u.email.toLowerCase().includes(termino)
    );
  });

  const toggleEstadoUsuario = async (id: number, isActiveActual: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const url = isActiveActual 
        ? `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${id}` 
        : `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${id}/reactivar`; 
      
      const method = isActiveActual ? "DELETE" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Error al cambiar el estado del usuario");
      
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, is_active: !isActiveActual } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al crear usuario");
      }

      await fetchUsuarios(); 
      setIsModalOpen(false);
      setFormData({ nombre: "", apellidos: "", email: "", password: "", rol: "estudiante" }); 
    } catch (err: any) {
      alert(err.message);
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
      rol: u.rol
    });
    setIsEditModalOpen(true);
  };

  const handleEditarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${editFormData.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          nombre: editFormData.nombre,
          apellidos: editFormData.apellidos,
          email: editFormData.email,
          rol: editFormData.rol
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al actualizar usuario");
      }

      await fetchUsuarios();
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // NUEVO: Funciones de Hard Delete y Reset Password
  const handleEliminarDefinitivo = async (id: number, email: string) => {
    const confirmacion = window.confirm(`⚠️ ADVERTENCIA: ¿Estás completamente seguro de que deseas ELIMINAR a ${email}? Esta acción borrará todo su historial y no se puede deshacer.`);
    if (!confirmacion) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${id}/hard-delete`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al eliminar usuario permanentemente");
      }

      // Quitamos al usuario de la lista local en vez de recargar todo
      setUsuarios(usuarios.filter(u => u.id !== id));
      alert("Usuario eliminado correctamente.");
    } catch (err: any) {
      alert(err.message);
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/${resetFormData.id}/reset-password-admin`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ nueva_password: resetFormData.nueva_password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al resetear la contraseña");
      }

      alert(`Contraseña actualizada exitosamente para ${resetFormData.email}`);
      setIsResetModalOpen(false);
      setResetFormData({ id: 0, email: "", nueva_password: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-muted">
        <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Cargando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans animate-in fade-in slide-in-from-top-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Gestión de Usuarios</h1>
          <p className="text-text-muted mt-1">Administra accesos, roles y estados de los alumnos.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 w-full md:w-auto justify-center border border-rose-200"
          >
            Cerrar Sesión
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <span>+</span> Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm mb-6 flex items-center gap-3">
        <span className="text-xl">🔍</span>
        <input 
          type="text" 
          placeholder="Buscar por nombre, apellidos o correo..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 bg-transparent outline-none text-primary font-medium placeholder:text-gray-400"
        />
      </div>

      <div className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-4"> {/* pb-4 para dar espacio si hay scroll */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-text-muted font-bold">
                <th className="p-5">Usuario</th>
                <th className="p-5">Correo</th>
                <th className="p-5 text-center">Rol</th>
                <th className="p-5 text-center">Estado</th>
                <th className="p-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-background/50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-menu-active text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {u.nombre.charAt(0)}{u.apellidos.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-primary capitalize whitespace-nowrap">{u.nombre} {u.apellidos}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 font-medium text-text-muted">{u.email}</td>
                    <td className="p-5 text-center">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-background border border-border text-text-muted px-2 py-1 rounded">
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      {u.is_active ? (
                        <span className="text-[11px] font-bold text-green-700 bg-green-100 border border-green-200 px-3 py-1 rounded-full whitespace-nowrap">Activo</span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-3 py-1 rounded-full whitespace-nowrap">Suspendido</span>
                      )}
                    </td>
                    <td className="p-5 text-right space-x-2 whitespace-nowrap">
                      <Link 
                        href={`/admin/usuarios/detalle?id=${u.id}`}
                        className="text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-block"
                      >
                        Progreso
                      </Link>
                      <button 
                        onClick={() => abrirModalEditar(u)}
                        className="text-[11px] font-bold text-menu-active bg-menu-active/10 hover:bg-menu-active/20 px-3 py-1.5 rounded-lg transition-colors inline-block"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => abrirModalReset(u)}
                        className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors inline-block"
                      >
                        Clave
                      </button>
                      <button 
                        onClick={() => toggleEstadoUsuario(u.id, u.is_active)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors inline-block ${
                          u.is_active 
                            ? "text-rose-600 bg-rose-50 hover:bg-rose-100" 
                            : "text-green-600 bg-green-50 hover:bg-green-100"
                        }`}
                      >
                        {u.is_active ? "Suspender" : "Reactivar"}
                      </button>
                      <button 
                        onClick={() => handleEliminarDefinitivo(u.id, u.email)}
                        className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-colors inline-block shadow-sm"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-muted font-medium">
                    No se encontraron usuarios con "{busqueda}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl shadow-xl border border-border w-full max-w-md p-6 md:p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-text-muted hover:text-rose-500 font-bold">✕</button>
            <h2 className="text-2xl font-black text-primary mb-6">Nuevo Usuario</h2>
            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Nombre</label>
                  <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Apellidos</label>
                  <input type="text" required value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Correo Electrónico</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Contraseña Temporal</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Rol del Sistema</label>
                <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active font-medium">
                  <option value="estudiante">Alumno</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loadingAction} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all">
                  {loadingAction ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl shadow-xl border border-border w-full max-w-md p-6 md:p-8 relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-text-muted hover:text-rose-500 font-bold">✕</button>
            <h2 className="text-2xl font-black text-primary mb-6">Editar Usuario</h2>
            <form onSubmit={handleEditarUsuario} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Nombre</label>
                  <input type="text" required value={editFormData.nombre} onChange={e => setEditFormData({...editFormData, nombre: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Apellidos</label>
                  <input type="text" required value={editFormData.apellidos} onChange={e => setEditFormData({...editFormData, apellidos: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Correo Electrónico</label>
                <input type="email" required value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Rol del Sistema</label>
                <select value={editFormData.rol} onChange={e => setEditFormData({...editFormData, rol: e.target.value})} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active font-medium">
                  <option value="estudiante">Alumno</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={loadingAction} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all">
                  {loadingAction ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NUEVO: Modal Reset Password */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl shadow-xl border border-border w-full max-w-sm p-6 md:p-8 relative">
            <button onClick={() => setIsResetModalOpen(false)} className="absolute top-6 right-6 text-text-muted hover:text-rose-500 font-bold">✕</button>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🔑</div>
              <h2 className="text-2xl font-black text-primary">Resetear Clave</h2>
              <p className="text-sm text-text-muted mt-1 break-all">{resetFormData.email}</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Nueva Contraseña</label>
                <input 
                  type="text" // Type text para que el admin la pueda leer mientras la escribe
                  required 
                  placeholder="Ej: Temporal123!"
                  value={resetFormData.nueva_password} 
                  onChange={e => setResetFormData({...resetFormData, nueva_password: e.target.value})} 
                  className="w-full bg-background border border-border px-3 py-3 rounded-xl outline-none focus:border-amber-500 font-medium" 
                />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loadingAction} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-md">
                  {loadingAction ? "Guardando..." : "Confirmar Cambio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}