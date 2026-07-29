"use client";

import { getClientToken } from "@/lib/authToken";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  FaBook,
  FaBookOpen,
  FaComments,
  FaCalendarDays,
  FaChalkboard,
  FaChartLine,
  FaHeadphonesSimple,
  FaListCheck,
  FaMicrophone,
  FaRobot,
  FaUserCheck,
  FaLanguage,
  FaBars,
  FaXmark,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa6";
import { AppRole, getRoleFromJwt, normalizeRole } from "@/lib/rbac";
import { useSidebar } from "@/context/SidebarContext";

type MenuItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }> };

const MENU_BY_ROLE: Record<AppRole, MenuItem[]> = {
  estudiante: [
    { name: "Lectura", href: "/alumno/lectura", icon: FaBook },
    { name: "Gramática", href: "/alumno/gramatica", icon: FaBookOpen },
    { name: "Escucha", href: "/alumno/escucha", icon: FaHeadphonesSimple },
    { name: "Chat Roleplay", href: "/alumno/chatrol", icon: FaComments },
    { name: "Habla", href: "/alumno/habla", icon: FaMicrophone },
    { name: "Vocabulario", href: "/alumno/vocabulario", icon: FaLanguage },
    { name: "Mis Tareas", href: "/alumno/tareas", icon: FaListCheck },
    { name: "Calendario", href: "/alumno/calendario", icon: FaCalendarDays },
  ],
  tutor: [
    { name: "Generar Tareas (IA)", href: "/maestro/tareas-generador", icon: FaRobot },
    { name: "Mis Asignaciones", href: "/maestro/asignaciones", icon: FaChalkboard },
    { name: "Calificaciones", href: "/maestro/calificaciones", icon: FaListCheck },
    { name: "Calendario de Grupo", href: "/maestro/calendario", icon: FaCalendarDays },
  ],
  padres: [
    { name: "Dashboard", href: "/padre/dashboard", icon: FaChartLine },
    { name: "Progreso", href: "/padre/progreso", icon: FaUserCheck },
  ],
  admin: [
    { name: "Usuarios", href: "/admin/usuarios", icon: FaUserCheck },
    { name: "Calendario", href: "/calendario", icon: FaCalendarDays },
  ],
};

export default function Menu() {
  const pathname = usePathname();
  const [role, setRole] = useState<AppRole | null>(null);

  // Variables globales del contexto
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  useEffect(() => {
    const loadRole = () => {
      try {
        const token = getClientToken();
        if (!token) {
          setRole(null);
          return;
        }
        setRole(getRoleFromJwt(token));
      } catch {
        setRole(null);
      }
    };

    loadRole();
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  const normalizedRole = normalizeRole(role);
  const itemsToRender = normalizedRole ? MENU_BY_ROLE[normalizedRole] ?? [] : [];

  return (
    <>
      {/* Botón flotante móvil */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-3 left-4 z-50 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/10 shadow-lg cursor-pointer"
        aria-label="Abrir menú"
      >
        <FaBars size={20} />
      </button>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/80 dark:border-white/10 shadow-xl z-50 flex flex-col transition-all duration-300 ${
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex items-center justify-between py-6 px-4 border-b border-slate-200/80 dark:border-white/10 relative">
          <div className="flex items-center gap-3 overflow-hidden">
            <Image
              src="/Logo sin Slogan_letra_blanca.png"
              alt="Logo"
              width={38}
              height={38}
              priority
              className="shrink-0"
            />
            {!isCollapsed && (
              <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-wider truncate">
                MasterHub
              </h1>
            )}
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 cursor-pointer"
          >
            <FaXmark size={20} />
          </button>

          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 bg-sky-500 text-white rounded-full items-center justify-center border border-white/20 shadow-md hover:bg-sky-400 transition-all cursor-pointer z-10"
            title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          >
            {isCollapsed ? <FaChevronRight size={11} /> : <FaChevronLeft size={11} />}
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar">
          <ul>
            {itemsToRender.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center ${
                      isCollapsed ? "justify-center px-3" : "px-4"
                    } py-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isActive
                        ? "bg-sky-500/15 dark:bg-sky-500/25 text-sky-700 dark:text-sky-200 font-semibold border-sky-400/40 shadow-sm dark:shadow-lg dark:shadow-sky-950/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white font-medium border-transparent"
                    }`}
                  >
                    <Icon className={`text-xl ${isCollapsed ? "" : "mr-3.5"} ${isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-400"}`} />
                    {!isCollapsed && <span className="text-sm truncate">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}