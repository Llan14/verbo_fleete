import PublicFooter from "@/components/branding/PublicFooter";
import PublicNavbar from "@/components/branding/PublicNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-text-main">
      <PublicNavbar />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
