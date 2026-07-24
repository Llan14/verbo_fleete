"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaCommentDots,
  FaHeadphonesSimple,
  FaBookOpen,
  FaPencil,
  FaBookOpenReader,
  FaCalendarDays,
  FaUserTie,
  FaUsers,
} from "react-icons/fa6";

export default function Menu() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const userData = await response.json();
        setRole(userData.rol);
      } catch {
        setRole(null);
      }
    };

    loadRole();
  }, []);

  const menuItems = [
    { name: "Habla", href: "/speaking/", icon: FaCommentDots },
    { name: "Audio", href: "/listening/", icon: FaHeadphonesSimple },
    { name: "Lectura", href: "/reading/", icon: FaBookOpenReader },
    { name: "Gramática", href: "/grammar/", icon: FaBookOpen },
    { name: "Chat rol", href: "/writing/", icon: FaPencil },
    { name: "Calendario", href: "/calendario", icon: FaCalendarDays },
  ];

  const roleSpecificItems = [] as Array<{ name: string; href: string; icon: typeof FaUserTie }>;

  if (role === "tutor") {
    roleSpecificItems.push({ name: "Tutor", href: "/tutor", icon: FaUserTie });
  }

  if (role === "padres" || role === "parent") {
    roleSpecificItems.push({ name: "Padres", href: "/padres", icon: FaUsers });
  }

  const itemsToRender = [...menuItems, ...roleSpecificItems];

  return (
    <div className="bg-menu-bg fixed top-0 left-0 h-screen w-70 shadow-xl z-50">
      <div className="flex flex-col items-center py-8">
        <img className="w-32 mb-4" src="/logo.png" alt="Logo" />
        <h1 className="font-bold text-menu-text text-xl tracking-wide">
          VerboFlete
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