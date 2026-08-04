import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AppRole, getRoleFromJwt, isPathAllowedForRole, isPublicRoute, roleHomePath } from '@/lib/rbac';

function canonicalizeLegacyPath(pathname: string, role: AppRole) {
  const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  if (cleanPath === '/dashboard') {
    return roleHomePath(role);
  }

  if (role === 'estudiante') {
    if (cleanPath === '/alumno') return '/alumno/dashboard';
    if (cleanPath === '/tareas') return '/alumno/tareas';
    if (cleanPath === '/calendario') return '/alumno/calendario';
    if (cleanPath === '/sessions/ejercicio') return '/alumno/habla';
    if (cleanPath === '/reading') return '/alumno/lectura';
    if (cleanPath === '/grammar') return '/alumno/gramatica';
    if (cleanPath === '/listening') return '/alumno/escucha';
    if (cleanPath === '/writing') return '/alumno/chatrol';
    if (cleanPath === '/speaking') return '/alumno/habla';
  }

  if (role === 'tutor') {
    if (cleanPath === '/tutor') return '/maestro/tareas-generador';
    if (cleanPath === '/calendario') return '/maestro/calendario';
  }

  if (role === 'padres') {
    if (cleanPath === '/padres') return '/padre/dashboard';
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value ?? request.cookies.get('access_token')?.value;

  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (isPublicRoute(pathname)) {
    if (token) {
      const userRole = getRoleFromJwt(token);
      return NextResponse.redirect(new URL(roleHomePath(userRole), request.url));
    }

    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const userRole = getRoleFromJwt(token);
  if (!userRole) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    response.cookies.delete('access_token');
    return response;
  }

  const canonicalPath = canonicalizeLegacyPath(pathname, userRole);
  if (canonicalPath && canonicalPath !== pathname) {
    return NextResponse.redirect(new URL(canonicalPath, request.url));
  }

  if (!isPathAllowedForRole(userRole, pathname)) {
    return NextResponse.redirect(new URL(roleHomePath(userRole), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
     '/((?!api|_next/static|_next/image|favicon.ico|torre.png|logo.png).*)',
  ],
};