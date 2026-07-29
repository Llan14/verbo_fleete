"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from "@/components/GlassCard";

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: 'admin' | 'tutor' | 'estudiante';
}

interface Grupo {
  id: number;
  nombre: string;
  descripcion: string | null;
  alumnos: Usuario[];
  tutores: Usuario[];
}

export default function AdminGruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombreGrupo, setNombreGrupo] = useState('');
  const [descripcionGrupo, setDescripcionGrupo] = useState('');

  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [tutorSeleccionado, setTutorSeleccionado] = useState<string>('');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('');

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    const token = getClientToken();
    if (!token) {
      setError("No autenticado.");
      setLoading(false);
      return;
    }

    try {
      const [gruposRes, usuariosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!gruposRes.ok || !usuariosRes.ok) {
        throw new Error("Error al cargar los datos iniciales.");
      }

      const gruposData = await gruposRes.json();
      const usuariosData = await usuariosRes.json();

      setGrupos(gruposData);
      setUsuarios(usuariosData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCrearGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = getClientToken();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre: nombreGrupo, descripcion: descripcionGrupo })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "No se pudo crear el grupo.");
      }

      setNombreGrupo('');
      setDescripcionGrupo('');
      await fetchAllData();

    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAsignarUsuario = async (rol: 'tutor' | 'alumno') => {
    setError(null);
    const token = getClientToken();
    const usuarioId = rol === 'tutor' ? tutorSeleccionado : alumnoSeleccionado;

    if (!grupoSeleccionado || !usuarioId) {
      setError("Por favor, selecciona un grupo y un usuario.");
      return;
    }

    try {
      const endpoint = rol === 'tutor' ? 'tutores' : 'alumnos';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grupos/${grupoSeleccionado}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuario_id: parseInt(usuarioId) })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || `No se pudo asignar el ${rol}.`);
      }

      setTutorSeleccionado('');
      setAlumnoSeleccionado('');
      await fetchAllData();

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="w-12 h-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Cargando grupos...</p>
      </div>
    );
  }

  const tutoresDisponibles = usuarios.filter(u => u.rol === 'tutor');
  const alumnosDisponibles = usuarios.filter(u => u.rol === 'estudiante');

  return (
    <div className="max-w-7xl mx-auto font-sans animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Grupos</h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Crea grupos, asigna tutores y añade alumnos.</p>
        </div>
        <Link
          href="/admin/usuarios"
          className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold py-2.5 px-5 rounded-xl transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2 justify-center backdrop-blur-md shadow-sm"
        >
          ← Volver a Usuarios
        </Link>
      </div>

      {error && (
        <div className="bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-800 dark:text-rose-200 p-4 rounded-xl relative text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Crear Nuevo Grupo</h2>
            <form onSubmit={handleCrearGrupo} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del Grupo"
                value={nombreGrupo}
                onChange={e => setNombreGrupo(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2.5 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
              <input
                type="text"
                placeholder="Descripción (Opcional)"
                value={descripcionGrupo}
                onChange={e => setDescripcionGrupo(e.target.value)}
                className="w-full bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2.5 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-sky-950/20 cursor-pointer"
              >
                Crear Grupo
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Asignar Usuarios</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Grupo de Destino
                </label>
                <select
                  onChange={e => setGrupoSeleccionado(parseInt(e.target.value))}
                  value={grupoSeleccionado || ''}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2.5 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 font-medium text-sm cursor-pointer shadow-sm"
                >
                  <option value="" disabled>-- Elige un grupo --</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Asignar Tutor
                  </label>
                  <select
                    onChange={e => setTutorSeleccionado(e.target.value)}
                    value={tutorSeleccionado}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2.5 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 font-medium text-sm cursor-pointer shadow-sm disabled:opacity-50"
                    disabled={!grupoSeleccionado}
                  >
                    <option value="" disabled>-- Elige un tutor --</option>
                    {tutoresDisponibles.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => handleAsignarUsuario('tutor')}
                  className="bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 font-bold py-2 px-4 rounded-xl transition-all h-[42px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!grupoSeleccionado || !tutorSeleccionado}
                >
                  Asignar
                </button>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Asignar Alumno
                  </label>
                  <select
                    onChange={e => setAlumnoSeleccionado(e.target.value)}
                    value={alumnoSeleccionado}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-3 py-2.5 rounded-xl outline-none focus:border-sky-500 dark:focus:border-sky-400 font-medium text-sm cursor-pointer shadow-sm disabled:opacity-50"
                    disabled={!grupoSeleccionado}
                  >
                    <option value="" disabled>-- Elige un alumno --</option>
                    {alumnosDisponibles.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => handleAsignarUsuario('alumno')}
                  className="bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 font-bold py-2 px-4 rounded-xl transition-all h-[42px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!grupoSeleccionado || !alumnoSeleccionado}
                >
                  Asignar
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Grupos Existentes</h2>
            {grupos.length === 0 ? (
              <p className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                No hay grupos creados todavía.
              </p>
            ) : (
              <ul className="space-y-4">
                {grupos.map(grupo => (
                  <li key={grupo.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 rounded-2xl">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{grupo.nombre}</h3>
                    {grupo.descripcion && (
                      <p className="text-slate-600 dark:text-slate-300 text-sm mb-3 mt-1">{grupo.descripcion}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Tutores ({grupo.tutores.length})
                        </h4>
                        <ul className="text-sm space-y-1">
                          {grupo.tutores.map(t => (
                            <li key={t.id} className="text-sky-700 dark:text-sky-300 font-medium">
                              • {t.nombre} {t.apellidos}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Alumnos ({grupo.alumnos.length})
                        </h4>
                        <ul className="text-sm space-y-1">
                          {grupo.alumnos.map(a => (
                            <li key={a.id} className="text-sky-700 dark:text-sky-300 font-medium">
                              • {a.nombre} {a.apellidos}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}