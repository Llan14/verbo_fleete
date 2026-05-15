"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaCommentDots,
  FaHeadphonesSimple,
  FaBookOpen,
  FaPencil,
  FaBookOpenReader, // <-- Nuevo ícono importado
} from "react-icons/fa6";

export default function Menu() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Habla", href: "/speaking/", icon: FaCommentDots },
    { name: "Audio", href: "/listening/", icon: FaHeadphonesSimple },
    { name: "Lectura", href: "/reading/", icon: FaBookOpenReader },
    { name: "Gramática", href: "/grammar/", icon: FaBookOpen },
    { name: "Chat rol", href: "/writing/", icon: FaPencil },
  ];

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
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

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