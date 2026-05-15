'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/services/authService';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, llena todos los campos.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginUser(email, password);
      
      localStorage.setItem('token', data.access_token);
      Cookies.set('token', data.access_token, { expires: 7 }); 

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
        headers: { "Authorization": `Bearer ${data.access_token}` }
      });

      if (!res.ok) throw new Error("Error al verificar la identidad del usuario");
      
      const userData = await res.json();

      if (userData.rol === "admin") {
        router.push('/admin/usuarios/');
      } else {
        router.push('/dashboard/');
      }
      
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-5xl bg-surface rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
        
        <div className="hidden md:flex w-1/2 bg-secondary relative flex-col items-center justify-center text-white">
          <div className="absolute inset-0 opacity-95">
            <Image
              src="/torre.png"
              alt="Fondo de la aplicación"
              fill
              className="object-cover mix-blend-overlay"
              priority
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          <div className="flex justify-center mb-6">
            <div className="bg-primary text-white p-2 rounded-lg shadow-md h-12 w-12 flex items-center justify-center font-bold">
              VF
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Bienvenido a <br /> VerboFleete IA
            </h1>
            <p className="text-text-muted text-sm">
              Ingresa a tu cuenta de estudiante
            </p>
          </div>

          <form className="space-y-5 max-w-sm mx-auto w-full" onSubmit={handleLogin}>
            <div className="relative space-y-4">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={isLoading}
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-primary text-white font-semibold py-3 rounded-lg shadow-lg transition-colors duration-200 mt-4 
                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover cursor-pointer'}`}
            >
              {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
            
            {error && (
              <p className="text-red-500 text-sm text-center font-medium mt-2">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}