import "./globals.css";
import { Inter } from "next/font/google";
import ThemeInitializer from "@/components/ThemeInitializer";
import ThemeToggleGlobal from "@/components/ThemeToggleGlobal";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "VerboFleete IA",
  description: "Aprende francés con IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeInitializer />
        {children}
        <ThemeToggleGlobal />
      </body>
    </html>
  );
}