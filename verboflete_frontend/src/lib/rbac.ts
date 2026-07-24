export type AppRole = "estudiante" | "tutor" | "padres" | "admin";

const ROLE_ROUTE_PREFIXES: Record<AppRole, string[]> = {
  estudiante: ["/alumno", "/perfil"],
  tutor: ["/maestro", "/perfil"],
  padres: ["/padre", "/perfil"],
  admin: ["/admin", "/dashboard", "/perfil", "/alumno", "/maestro", "/padre"],
};

const ROLE_HOME: Record<AppRole, string> = {
  estudiante: "/alumno/tareas",
  tutor: "/maestro/tareas-generador",
  padres: "/padre/dashboard",
  admin: "/admin/usuarios",
};

const PUBLIC_ROUTES = ["/login", "/registro"];

export function normalizeRole(rawRole: string | null | undefined): AppRole | null {
  if (!rawRole) {
    return null;
  }

  const role = rawRole.trim().toLowerCase();
  if (role === "parent") {
    return "padres";
  }
  if (role === "maestro") {
    return "tutor";
  }
  if (role === "alumno") {
    return "estudiante";
  }
  if (role === "padre") {
    return "padres";
  }

  if (role === "estudiante" || role === "tutor" || role === "padres" || role === "admin") {
    return role;
  }

  return null;
}

export function roleHomePath(role: AppRole | null): string {
  if (!role) {
    return "/login";
  }
  return ROLE_HOME[role];
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export function isPathAllowedForRole(role: AppRole, pathname: string): boolean {
  if (role === "admin") {
    return true;
  }

  const allowedPrefixes = ROLE_ROUTE_PREFIXES[role] ?? [];
  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function decodeBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(base64 + padding);
}

export function getRoleFromJwt(token: string | null | undefined): AppRole | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payloadJson = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadJson) as { rol?: string; exp?: number; nbf?: number };
    const now = Math.floor(Date.now() / 1000);

    if (typeof payload.exp === "number" && now >= payload.exp) {
      return null;
    }

    if (typeof payload.nbf === "number" && now < payload.nbf) {
      return null;
    }

    return normalizeRole(payload.rol);
  } catch {
    return null;
  }
}

export function roleLabel(role: AppRole | null): string {
  if (role === "tutor") {
    return "Tutor";
  }
  if (role === "padres") {
    return "Padre";
  }
  if (role === "admin") {
    return "Administrador";
  }
  if (role === "estudiante") {
    return "Estudiante";
  }
  return "Usuario";
}
