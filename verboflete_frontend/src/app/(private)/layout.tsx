"use client";

import Header from "@/components/Header";
import Menu from "@/components/Menu";
import { BackgroundLayout } from "@/components/BackgroundLayout";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function PrivateLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <Menu />

      {/* El padding izquierdo cambia dinámicamente según el estado del menú */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <Header />

        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundLayout theme="dark">
      <SidebarProvider>
        <PrivateLayoutContent>{children}</PrivateLayoutContent>
      </SidebarProvider>
    </BackgroundLayout>
  );
}