import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getRoleFromJwt, roleHomePath } from "@/lib/rbac";

export default async function AlumnoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const role = getRoleFromJwt(token);
  if (role !== "estudiante" && role !== "admin") {
    redirect(roleHomePath(role));
  }

  return children;
}
