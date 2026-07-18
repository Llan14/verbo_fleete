"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

// --- Tipos de Datos ---
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
  // --- Estados del Componente ---
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el formulario de creación
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [descripcionGrupo, setDescripcionGrupo] = useState('');

  // Estados para la asignación
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [tutorSeleccionado, setTutorSeleccionado] = useState<string>('');
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('');

  // --- Funciones de API ---
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');

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
      await fetchAllData(); // Recargar la lista de grupos

    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAsignarUsuario = async (rol: 'tutor' | 'alumno') => {
    setError(null);
    const token = localStorage.getItem('token');
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

      // Limpiar selectores y recargar datos
      setTutorSeleccionado('');
      setAlumnoSeleccionado('');
      await fetchAllData();

    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Renderizado ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-text-muted">
        <div className="w-12 h-12 border-4 border-menu-active border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Cargando grupos...</p>
      </div>
    );
  }

  const tutoresDisponibles = usuarios.filter(u => u.rol === 'tutor');
  const alumnosDisponibles = usuarios.filter(u => u.rol === 'estudiante');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans animate-in fade-in slide-in-from-top-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Gestión de Grupos</h1>
          <p className="text-text-muted mt-1">Crea grupos, asigna tutores y añade alumnos.</p>
        </div>
        <Link
          href="/admin/usuarios"
          className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 w-full md:w-auto justify-center"
        >
          ← Volver a Usuarios
        </Link>
      </div>

      {error && <div className="bg-rose-100 border border-rose-200 text-rose-700 font-medium px-4 py-3 rounded-xl relative mb-6" role="alert">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna de Formularios */}
        <div className="lg:col-span-1 space-y-8">
          {/* 1. Crear Grupo */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold text-primary mb-4">Crear Nuevo Grupo</h2>
            <form onSubmit={handleCrearGrupo} className="space-y-4">
              <input type="text" placeholder="Nombre del Grupo" value={nombreGrupo} onChange={e => setNombreGrupo(e.target.value)} required className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
              <input type="text" placeholder="Descripción (Opcional)" value={descripcionGrupo} onChange={e => setDescripcionGrupo(e.target.value)} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active" />
              <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-xl transition-all">Crear Grupo</button>
            </form>
          </div>

          {/* 2. Asignar Usuarios */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold text-primary mb-4">Asignar Usuarios</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Grupo de Destino</label>
                <select onChange={e => setGrupoSeleccionado(parseInt(e.target.value))} value={grupoSeleccionado || ''} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active font-medium">
                  <option value="" disabled>-- Elige un grupo --</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              {/* Asignar Tutor */}
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Asignar Tutor</label>
                  <select onChange={e => setTutorSeleccionado(e.target.value)} value={tutorSeleccionado} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active font-medium" disabled={!grupoSeleccionado}>
                    <option value="" disabled>-- Elige un tutor --</option>
                    {tutoresDisponibles.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
                  </select>
                </div>
                <button onClick={() => handleAsignarUsuario('tutor')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl transition-all h-[42px]" disabled={!grupoSeleccionado || !tutorSeleccionado}>Asignar</button>
              </div>
              {/* Asignar Alumno */}
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Asignar Alumno</label>
                  <select onChange={e => setAlumnoSeleccionado(e.target.value)} value={alumnoSeleccionado} className="w-full bg-background border border-border px-3 py-2 rounded-xl outline-none focus:border-menu-active font-medium" disabled={!grupoSeleccionado}>
                    <option value="" disabled>-- Elige un alumno --</option>
                    {alumnosDisponibles.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellidos}</option>)}
                  </select>
                </div>
                <button onClick={() => handleAsignarUsuario('alumno')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl transition-all h-[42px]" disabled={!grupoSeleccionado || !alumnoSeleccionado}>Asignar</button>
              </div>
            </div>
          </div>
        </div>

        {/* Columna de Lista de Grupos */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-2">
            <h2 className="text-xl font-bold text-primary p-4">Grupos Existentes</h2>
            {grupos.length === 0 ? (
              <p className="p-12 text-center text-text-muted font-medium">No hay grupos creados todavía.</p>
            ) : (
              <ul className="space-y-2">
                {grupos.map(grupo => (
                  <li key={grupo.id} className="p-4 bg-background hover:bg-background/50 border border-border rounded-xl transition-colors">
                    <h3 className="text-lg font-bold text-primary">{grupo.nombre}</h3>
                    {grupo.descripcion && <p className="text-text-muted text-sm mb-3">{grupo.descripcion}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Tutores ({grupo.tutores.length})</h4>
                        <ul className="text-sm space-y-1">
                          {grupo.tutores.map(t => <li key={t.id} className="text-primary font-medium">{t.nombre} {t.apellidos}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">Alumnos ({grupo.alumnos.length})</h4>
                        <ul className="text-sm space-y-1">
                          {grupo.alumnos.map(a => <li key={a.id} className="text-primary font-medium">{a.nombre} {a.apellidos}</li>)}
                        </ul>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}