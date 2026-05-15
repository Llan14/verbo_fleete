"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const userName = "Estudiante"; 

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    Cookies.remove("token");
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
    <header className="w-full h-16 bg-surface border-b border-border flex items-center px-8 relative z-40 shadow-sm">
      <div className="relative ml-auto" ref={menuRef}>
        
        <button 
          onClick={toggleMenu}
          className="flex items-center gap-3 focus:outline-none hover:bg-gray-50 py-1 px-2 rounded-lg transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>

          <span className="text-primary font-bold text-sm">{userName}</span>

          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 text-text-muted transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-3 w-48 bg-surface rounded-xl shadow-lg py-2 border border-border overflow-hidden animate-in fade-in slide-in-from-top-2">
            
            <Link 
              href="/perfil/"
              prefetch={false} 
              className="block px-4 py-2 text-sm text-text-main hover:bg-gray-50 hover:text-primary transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Mi Perfil
            </Link>

            <Link 
              href="/dashboard/"
              prefetch={false} 
              className="block px-4 py-2 text-sm text-text-main hover:bg-gray-50 hover:text-primary transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            
            <div className="border-t border-border my-1"></div>
            
            <button 
              className="w-full text-left block px-4 py-2 text-red-500 hover:bg-red-50 transition-colors text-sm font-bold cursor-pointer"
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