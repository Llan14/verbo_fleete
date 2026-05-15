import Header from "@/components/Header";
import Menu from "@/components/Menu";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Menu />

      <div className="flex-1 ml-70 flex flex-col">

      <Header />

      <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}