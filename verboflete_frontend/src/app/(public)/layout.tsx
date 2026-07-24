"use client";

import { usePathname } from "next/navigation";
import PublicFooter from "@/components/branding/PublicFooter";
import PublicNavbar from "@/components/branding/PublicNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const cleanPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const isAuthExperience = cleanPath === "/login" || cleanPath === "/recuperar-acceso";

  if (isAuthExperience) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-text-main">
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
