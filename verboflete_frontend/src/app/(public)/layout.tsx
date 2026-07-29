"use client";

import { usePathname } from "next/navigation";
import PublicFooter from "@/components/branding/PublicFooter";
import PublicNavbar from "@/components/branding/PublicNavbar";
import { BackgroundLayout } from "@/components/BackgroundLayout";

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
    <BackgroundLayout theme="dark">
      <div className="flex min-h-screen flex-col">
        <PublicNavbar />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </BackgroundLayout>
  );
}