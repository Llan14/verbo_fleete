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
} from "react-icons/fa6";
import { AppRole, getRoleFromJwt, normalizeRole } from "@/lib/rbac";

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

  const normalizedRole = normalizeRole(role);
  const itemsToRender = normalizedRole ? MENU_BY_ROLE[normalizedRole] ?? [] : [];

  return (
    <div className="bg-menu-bg fixed top-0 left-0 h-screen w-70 shadow-xl z-50">
      <div className="flex flex-col items-center py-8">
        <div className="mb-4">
          <div className="hidden md:block">
            <Image
              src="/logoMHT_color.png"
              alt="MasterHubTraining"
              width={136}
              height={40}
              className="block dark:hidden"
              priority
            />
            <Image
              src="/logoMHT_blanco.png"
              alt="MasterHubTraining"
              width={136}
              height={40}
              className="hidden dark:block"
              priority
            />
          </div>
          <div className="block md:hidden">
            <Image
              src="/Logo sin Slogan_Color.png"
              alt="MasterHubTraining Compacto"
              width={54}
              height={54}
              className="block dark:hidden"
              priority
            />
            <Image
              src="/Logo sin Slogan_letra_blanca.png"
              alt="MasterHubTraining Compacto"
              width={54}
              height={54}
              className="hidden dark:block"
              priority
            />
          </div>
        </div>
        <h1 className="font-bold text-menu-text text-xl tracking-wide">
          MasterHubTraining
        </h1>
      </div>

      <nav className="mt-4">
        <ul className="space-y-1">
          {itemsToRender.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className={`flex items-center px-8 py-4 cursor-pointer transition-all duration-200 border-l-4 ${
                    isActive
                      ? "bg-menu-active text-menu-bg border-menu-active font-bold" 
                      : "text-menu-text border-transparent hover:bg-white/10 hover:border-menu-active/50 font-medium"
                  }`}
                >
                  <Icon className={`mr-4 text-xl ${isActive ? "text-menu-bg" : "text-menu-active"}`} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}