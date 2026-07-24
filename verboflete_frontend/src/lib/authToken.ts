import Cookies from "js-cookie";

export function getClientToken(): string | null {
  const cookieToken = Cookies.get("token") ?? Cookies.get("access_token") ?? null;
  if (cookieToken) {
    return cookieToken;
  }

  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }

  return null;
}
