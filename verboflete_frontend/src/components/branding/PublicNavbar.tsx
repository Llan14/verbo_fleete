import Image from "next/image";
import Link from "next/link";

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/login" className="inline-flex items-center gap-3" aria-label="Ir al inicio">
          <Image
            src="/logoMHT_color.png"
            alt="MHT"
            width={146}
            height={42}
            priority
            className="h-auto w-[132px] md:w-[146px]"
          />
        </Link>
      </div>
    </header>
  );
}
