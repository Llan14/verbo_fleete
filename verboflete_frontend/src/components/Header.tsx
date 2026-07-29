"use client";

import { getClientToken } from "@/lib/authToken";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getRoleFromJwt, roleHomePath, roleLabel } from "@/lib/rbac";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Usuario");
  const [homeHref, setHomeHref] = useState("/dashboard/");
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const token = getClientToken();
        if (!token) {
          setUserName("Usuario");
          setHomeHref("/login");
          return;
        }

        const role = getRoleFromJwt(token);
        setUserName(roleLabel(role));
        setHomeHref(roleHomePath(role));
      } catch {
        setUserName("Usuario");
        setHomeHref("/login");
      }
    };

    loadUser();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("access_token");
    sessionStorage.removeItem("verboFleteContext");
    router.push("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full h-16 bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 flex items-center px-8 relative z-40 shadow-sm transition-all duration-300">
      <div className="relative ml-auto" ref={menuRef}>
        <button 
          onClick={toggleMenu}
          className="flex items-center gap-3 focus:outline-none hover:bg-slate-100 dark:hover:bg-white/10 py-1.5 px-3 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10"
        >
          <div className="w-9 h-9 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>

          <span className="text-slate-800 dark:text-white font-semibold text-sm tracking-wide">{userName}</span>

          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 text-slate-500 dark:text-slate-300 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-3 w-52 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-2xl py-2 border border-slate-200/80 dark:border-white/15 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
            
            <Link 
              href="/perfil/"
              prefetch={false} 
              className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Mi Perfil
            </Link>

            <Link 
              href={homeHref}
              prefetch={false} 
              className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            
            <div className="border-t border-slate-200/80 dark:border-white/10 my-1"></div>
            
            <button 
              className="w-full text-left block px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 transition-colors text-sm font-semibold cursor-pointer"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}