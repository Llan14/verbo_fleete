import Image from "next/image";

export default function PublicFooter() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-8 md:px-8">
        <Image
          src="/logoMHT_blanco.png"
          alt="MHT"
          width={140}
          height={42}
          className="h-auto w-[128px] md:w-[140px]"
        />
        <p className="text-xs text-white/75">MHT Plataforma Academica Modular</p>
      </div>
    </footer>
  );
}
